import type { CategorizationResult } from "@/lib/categorizer/types";
import { cbsProvider as defaultCbsProvider } from "@/lib/cbs";
import type { CategoryCode, CbsInflationProvider } from "@/lib/cbs/types";
import { getWeightedCbsRate } from "./cbs-aggregation";
import {
  groupByCategory,
  groupByMonth,
  monthsIncluded,
} from "./weights";
import {
  InsufficientDataError,
  type CategoryBreakdown,
  type InflationCalculation,
} from "./types";

/** Default floor below which a personal-inflation number is unreliable. */
export const DEFAULT_MIN_TRANSACTIONS = 20;

export interface CalculateInflationOptions {
  /** CBS rate source. Defaults to the registered provider in `@/lib/cbs`. */
  cbsProvider?: CbsInflationProvider;
  /** Minimum number of categorised transactions required. Default: 20. */
  minTransactions?: number;
}

export async function calculateInflation(
  categorizationResults: readonly CategorizationResult[],
  options: CalculateInflationOptions = {},
): Promise<InflationCalculation> {
  const provider = options.cbsProvider ?? defaultCbsProvider;
  const minRequired = options.minTransactions ?? DEFAULT_MIN_TRANSACTIONS;

  // -- 1. Totals over the input ---------------------------------------------
  const debitInputs = categorizationResults.filter(
    (r) => r.transaction.type === "debit",
  );
  const categorised = debitInputs.filter((r) => r.category !== null);
  const uncategorised = debitInputs.filter((r) => r.category === null);

  if (categorised.length === 0) {
    throw new InsufficientDataError(
      "Geen transacties konden gecategoriseerd worden.",
      0,
      minRequired,
    );
  }
  if (categorised.length < minRequired) {
    throw new InsufficientDataError(
      `Te weinig data voor betrouwbare berekening: ${categorised.length} transacties gecategoriseerd, ` +
        `minimaal ${minRequired} vereist. Upload bij voorkeur een hele maand of meer voor een nauwkeurig beeld.`,
      categorised.length,
      minRequired,
    );
  }

  const uncategorizedRatio = uncategorised.length / debitInputs.length;
  const uncategorizedSpending = uncategorised.reduce(
    (s, r) => s + r.transaction.amount,
    0,
  );
  const categorisedSpending = categorised.reduce(
    (s, r) => s + r.transaction.amount,
    0,
  );
  const grossSpending = categorisedSpending + uncategorizedSpending;
  const uncategorizedSpendingPct =
    grossSpending > 0 ? (uncategorizedSpending / grossSpending) * 100 : 0;
  const months = monthsIncluded(debitInputs);

  // -- 2. Per-category totals + per-month-and-category totals ---------------
  const totalsByCategory = groupByCategory(categorised);
  const monthlyByCategory = groupByMonth(categorised);

  // -- 3. Resolve CBS rates per category ------------------------------------
  type Resolved = {
    code: CategoryCode;
    spending: number;
    transactionCount: number;
    cbsRate: number | null;
  };
  const resolved: Resolved[] = [];
  for (const [code, { total, count }] of totalsByCategory) {
    const perMonth = monthlyByCategory.get(code) ?? new Map<string, number>();
    const { rate } = await getWeightedCbsRate(code, perMonth, provider);
    resolved.push({
      code,
      spending: total,
      transactionCount: count,
      cbsRate: rate,
    });
  }

  // -- 4. Split CBS-eligible vs CBS-missing categories ----------------------
  const eligible = resolved.filter(
    (r): r is Resolved & { cbsRate: number } => r.cbsRate !== null,
  );
  const missing = resolved.filter((r) => r.cbsRate === null);

  const eligibleSpendingTotal = eligible.reduce((s, r) => s + r.spending, 0);
  const totalSpending =
    eligibleSpendingTotal + missing.reduce((s, r) => s + r.spending, 0);

  // -- 5. Weights + contributions -------------------------------------------
  const breakdown: CategoryBreakdown[] = eligible.map((r) => {
    const weight = eligibleSpendingTotal > 0 ? r.spending / eligibleSpendingTotal : 0;
    const contribution = weight * r.cbsRate;
    return {
      category: r.code,
      spending: r.spending,
      weight,
      cbsRate: r.cbsRate,
      contribution,
      transactionCount: r.transactionCount,
    };
  });

  breakdown.sort((a, b) => b.contribution - a.contribution);

  const totalInflation = breakdown.reduce((s, r) => s + r.contribution, 0);

  return {
    totalInflation,
    totalSpending,
    categoriesUsed: breakdown.length,
    uncategorizedRatio,
    uncategorizedSpending,
    uncategorizedSpendingPct,
    monthsIncluded: months,
    breakdown,
    categoriesWithoutCbsData: missing.map((m) => m.code).sort(),
    spendingWithoutCbsData: missing.reduce((s, r) => s + r.spending, 0),
    referenceInflation: undefined,
  };
}
