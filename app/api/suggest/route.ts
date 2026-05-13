import { NextResponse } from "next/server";
import type { CategoryCode } from "@/lib/cbs/types";
import { getAiProvider } from "@/lib/categorizer/ai/provider-factory";
import { suggestCategories } from "@/lib/categorizer/ai/suggest";
import type { Transaction } from "@/lib/parsers/types";

interface SuggestRequestItem {
  id: string;
  merchant: string | null;
  description: string;
}

interface SuggestResponse {
  suggestions: Array<{ id: string; suggestedCategory: CategoryCode }>;
}

function err(message: string, status: number): Response {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Verwacht een JSON body met `transactions`.", 400);
  }

  const transactions = (body as { transactions?: unknown })?.transactions;
  if (!Array.isArray(transactions)) {
    return err("`transactions` ontbreekt of is geen array.", 400);
  }
  if (transactions.length === 0) {
    return NextResponse.json({ suggestions: [] } satisfies SuggestResponse, {
      status: 200,
    });
  }

  // Per CLAUDE.md privacy: only merchant + description leave the route.
  const stubs: Array<{ item: SuggestRequestItem; tx: Transaction }> = [];
  for (const raw of transactions) {
    const item = raw as Partial<SuggestRequestItem>;
    if (typeof item?.id !== "string" || typeof item?.description !== "string") {
      return err("Elke transactie heeft een `id` en `description` nodig.", 400);
    }
    stubs.push({
      item: {
        id: item.id,
        merchant: typeof item.merchant === "string" ? item.merchant : null,
        description: item.description,
      },
      tx: {
        date: new Date(0),
        amount: 0,
        type: "debit",
        code: "bc",
        counterpartyIban: null,
        counterpartyName: null,
        merchant: typeof item.merchant === "string" ? item.merchant : null,
        description: item.description,
        location: null,
        rawText: "",
      },
    });
  }

  const provider = getAiProvider();
  const verdicts = await suggestCategories(
    stubs.map((s) => s.tx),
    provider,
  );

  const suggestions = stubs.map((s, idx) => ({
    id: s.item.id,
    suggestedCategory: (verdicts.get(idx) ?? "12") as CategoryCode,
  }));

  return NextResponse.json({ suggestions } satisfies SuggestResponse, {
    status: 200,
  });
}
