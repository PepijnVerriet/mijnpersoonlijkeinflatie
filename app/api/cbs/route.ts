import { NextResponse } from "next/server";
import { cbsProvider } from "@/lib/cbs";
import { isValidMonth } from "@/lib/cbs/mock-provider";
import { CbsDataNotAvailableError } from "@/lib/cbs/types";

const CACHE_HEADER = "public, max-age=86400";

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
    const rates = await cbsProvider.getMonthlyRates(month);
    return NextResponse.json(
      { month, rates },
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
