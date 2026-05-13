import { NextResponse } from "next/server";
import { cbsProvider } from "@/lib/cbs";
import { mockProvider } from "@/lib/cbs/mock-provider";
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
   * True while the CBS layer is still served by the mock provider; flipped
   * automatically once `cbsProvider` is rewired to a real CBS-API client.
   */
  usingMockData: boolean;
  /** ISO timestamp of when the server computed the result. */
  calculatedAt: string;
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

  const categorizationResults = toCategorizationResults(
    txs as CalculateRequestTransaction[],
  );

  try {
    const calculation = await calculateInflation(categorizationResults);
    const response: CalculateResponse = {
      calculation,
      meta: {
        // Identity check tegen mockProvider singleton; werkt automatisch
        // zodra cbsProvider naar een echte provider verwijst.
        usingMockData: cbsProvider === mockProvider,
        calculatedAt: new Date().toISOString(),
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
