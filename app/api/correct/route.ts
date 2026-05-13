import { NextResponse } from "next/server";
import type { CategoryCode } from "@/lib/cbs/types";
import {
  logUserCorrections,
  type UserCorrectionEntry,
} from "@/lib/categorizer/ai/corrections-log";

const VALID_CATEGORIES = new Set<CategoryCode>([
  "01", "02", "03", "04", "05", "06",
  "07", "08", "09", "10", "11", "12",
]);

interface RawCorrection {
  merchant: string | null;
  description: string;
  aiSuggested: CategoryCode | null;
  userChose: CategoryCode;
}

function isValidCategory(x: unknown): x is CategoryCode {
  return typeof x === "string" && VALID_CATEGORIES.has(x as CategoryCode);
}

function err(message: string, status: number): Response {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Verwacht een JSON body met `corrections`.", 400);
  }

  const corrections = (body as { corrections?: unknown })?.corrections;
  if (!Array.isArray(corrections)) {
    return err("`corrections` ontbreekt of is geen array.", 400);
  }
  if (corrections.length === 0) {
    return NextResponse.json({ logged: 0 }, { status: 200 });
  }

  const entries: UserCorrectionEntry[] = [];
  for (const raw of corrections) {
    const c = raw as Partial<RawCorrection>;
    if (typeof c?.description !== "string") {
      return err("Elke correction heeft een `description` nodig.", 400);
    }
    if (!isValidCategory(c.userChose)) {
      return err("`userChose` is geen geldige CategoryCode.", 400);
    }
    const merchant =
      typeof c.merchant === "string" || c.merchant === null
        ? c.merchant
        : null;
    const aiSuggested = isValidCategory(c.aiSuggested) ? c.aiSuggested : null;

    entries.push({
      merchant,
      description: c.description,
      aiSuggested,
      userChose: c.userChose,
    });
  }

  // logUserCorrections swallows file-system errors internally so the
  // response always succeeds — UX must not break on a log hiccup.
  const logged = await logUserCorrections(entries);
  return NextResponse.json({ logged }, { status: 200 });
}
