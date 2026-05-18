import { NextResponse } from "next/server";
import { getCbsProvider } from "@/lib/cbs";
import type { CategoryCode } from "@/lib/cbs/types";
import {
  calculateInflation,
  InsufficientDataError,
  type InflationCalculation,
} from "@/lib/inflation";
import type { CategorizationResult } from "@/lib/categorizer/types";
import type { Transaction } from "@/lib/parsers/types";

interface CalculateRequestTransaction {
  id: string;
  date: string;
  amount: number;
  merchant: string | null;
  description: string;
  category: CategoryCode | null;
}

export interface CalculateMeta {
  /**
   * True als deze berekening (op zijn minst ten dele) op mock-data is
   * uitgekomen — direct (CBS_PROVIDER niet 'live') of via fallback nadat
   * een live-call faalde. Drijft de "demo waardes"-badge en eventuele
   * "CBS tijdelijk niet bereikbaar" banner in de UI.
   */
  usingMockData: boolean;
  /** ISO timestamp of when the server computed the result. */
  calculatedAt: string;
  /**
   * How many of the submitted transactions were skipped via
   * `excludedTransactionIds`. Only counts IDs that actually matched a
   * row in `transactions`; phantom IDs are ignored.
   */
  excludedCount: number;
  /** Sum (in euro) of the amounts of the excluded transactions. */
  excludedAmount: number;
}

export interface CalculateResponse {
  calculation: InflationCalculation;
  meta: CalculateMeta;
}

function err(message: string, status: number): Response {
  return NextResponse.json({ error: message }, { status });
}

function toCategorizationResults(
  txs: CalculateRequestTransaction[],
): CategorizationResult[] {
  return txs.map((t) => {
    const transaction: Transaction = {
      date: new Date(t.date),
      amount: t.amount,
      type: "debit",
      code: "bc",
      counterpartyIban: null,
      counterpartyName: null,
      merchant: t.merchant,
      description: t.description,
      location: null,
      rawText: "",
    };
    return {
      transaction,
      category: t.category,
      source: t.category === null ? "ai" : "user",
    };
  });
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Verwacht een JSON body met `transactions`.", 400);
  }

  const txs = (body as { transactions?: unknown })?.transactions;
  if (!Array.isArray(txs)) {
    return err("`transactions` ontbreekt of is geen array.", 400);
  }

  // Basic shape validation; the wire format keeps strings so we don't need
  // to be exhaustive — the calculator and parser will surface bad data.
  for (const raw of txs) {
    const t = raw as Partial<CalculateRequestTransaction>;
    if (
      typeof t?.id !== "string" ||
      typeof t?.date !== "string" ||
      typeof t?.amount !== "number"
    ) {
      return err("Onverwacht transactie-formaat.", 400);
    }
  }

  // User-driven exclusions from the Review screen (module 6b). Optional;
  // omitted by callers that don't know about the feature (backwards-compat).
  const rawExcluded = (body as { excludedTransactionIds?: unknown })
    ?.excludedTransactionIds;
  const excludedIds: string[] =
    Array.isArray(rawExcluded) && rawExcluded.every((x) => typeof x === "string")
      ? (rawExcluded as string[])
      : [];
  const excludedSet = new Set(excludedIds);

  const allTxs = txs as CalculateRequestTransaction[];
  const excludedTxs = allTxs.filter((t) => excludedSet.has(t.id));
  const keptTxs = allTxs.filter((t) => !excludedSet.has(t.id));

  const categorizationResults = toCategorizationResults(keptTxs);

  try {
    const cbs = getCbsProvider();
    const calculation = await calculateInflation(categorizationResults, {
      cbsProvider: cbs.provider,
    });
    const response: CalculateResponse = {
      calculation,
      meta: {
        usingMockData: cbs.usingMockData,
        calculatedAt: new Date().toISOString(),
        excludedCount: excludedTxs.length,
        excludedAmount: excludedTxs.reduce((s, t) => s + t.amount, 0),
      },
    };
    return NextResponse.json(response, { status: 200 });
  } catch (e) {
    if (e instanceof InsufficientDataError) {
      return err(e.message, 422);
    }
    // eslint-disable-next-line no-console
    console.error("[calculate] unexpected error", e);
    return err("Interne fout tijdens berekening.", 500);
  }
}
