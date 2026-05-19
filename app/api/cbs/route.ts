import { NextResponse } from "next/server";
import { getCbsProvider } from "@/lib/cbs";
import { USER_FACING_CATEGORY_CODES } from "@/lib/cbs/categories";
import { isValidMonth } from "@/lib/cbs/mock-provider";
import { CbsDataNotAvailableError } from "@/lib/cbs/types";

const CACHE_HEADER = "public, max-age=86400";
const USER_FACING_SET: ReadonlySet<string> = new Set(USER_FACING_CATEGORY_CODES);

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  if (!month || !isValidMonth(month)) {
    return NextResponse.json(
      { error: "Invalid or missing 'month' parameter. Expected YYYY-MM." },
      { status: 400 },
    );
  }

  try {
    const cbs = getCbsProvider();
    const rates = await cbs.provider.getMonthlyRates(month);
    // Filter system-only codes (CLAUDE.md §32): "14" Belastingen wordt in de
    // parser uitgefilterd en hoort niet in UI-breakdowns of dropdowns. Mock
    // levert codes 01-14, live CBS API levert 01-13; deze filter trekt beide
    // recht naar een consistente user-facing shape.
    const filteredRates = Object.fromEntries(
      Object.entries(rates).filter(([code]) => USER_FACING_SET.has(code)),
    );
    // Headline is optional in the response. Treat "no headline for this
    // month" as success-with-null, not 404 — the rates are still useful.
    let headline: number | null = null;
    try {
      headline = await cbs.provider.getMonthlyHeadline(month);
    } catch (err) {
      if (!(err instanceof CbsDataNotAvailableError)) throw err;
    }
    return NextResponse.json(
      { month, rates: filteredRates, headline },
      { status: 200, headers: { "Cache-Control": CACHE_HEADER } },
    );
  } catch (err) {
    if (err instanceof CbsDataNotAvailableError) {
      return NextResponse.json(
        { error: `No CBS data available for month ${month}.` },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
