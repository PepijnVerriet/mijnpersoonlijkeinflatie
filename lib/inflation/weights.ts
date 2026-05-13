import type { CategorizationResult } from "@/lib/categorizer/types";
import type { CategoryCode } from "@/lib/cbs/types";
import type { Transaction } from "@/lib/parsers/types";

/** "YYYY-MM" for a transaction's value date (local calendar). */
export function transactionMonth(t: Transaction): string {
  const y = t.date.getFullYear();
  const m = t.date.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

/** Defensive: keep only outgoing expenses with a known category. */
function isCategorisedExpense(
  r: CategorizationResult,
): r is CategorizationResult & { category: CategoryCode } {
  return r.category !== null && r.transaction.type === "debit";
}

/** Sum euro spending per CategoryCode across all categorised debit results. */
export function groupByCategory(
  results: readonly CategorizationResult[],
): Map<CategoryCode, { total: number; count: number }> {
  const out = new Map<CategoryCode, { total: number; count: number }>();
  for (const r of results) {
    if (!isCategorisedExpense(r)) continue;
    const cur = out.get(r.category) ?? { total: 0, count: 0 };
    cur.total += r.transaction.amount;
    cur.count += 1;
    out.set(r.category, cur);
  }
  return out;
}

/** Sum euro spending per (category, "YYYY-MM") pair. */
export function groupByMonth(
  results: readonly CategorizationResult[],
): Map<CategoryCode, Map<string, number>> {
  const out = new Map<CategoryCode, Map<string, number>>();
  for (const r of results) {
    if (!isCategorisedExpense(r)) continue;
    const month = transactionMonth(r.transaction);
    let perMonth = out.get(r.category);
    if (!perMonth) {
      perMonth = new Map<string, number>();
      out.set(r.category, perMonth);
    }
    perMonth.set(month, (perMonth.get(month) ?? 0) + r.transaction.amount);
  }
  return out;
}

/**
 * Turn per-category spending totals into shares (0..1) of the input total.
 * Skips categories with non-positive spending. Empty input → empty map.
 */
export function calculateWeights(
  spendingPerCategory: ReadonlyMap<CategoryCode, number>,
): Map<CategoryCode, number> {
  let total = 0;
  for (const value of spendingPerCategory.values()) {
    if (value > 0) total += value;
  }
  const weights = new Map<CategoryCode, number>();
  if (total === 0) return weights;
  for (const [code, value] of spendingPerCategory) {
    if (value > 0) weights.set(code, value / total);
  }
  return weights;
}

/** Unique "YYYY-MM" months represented in the categorised debit results. */
export function monthsIncluded(
  results: readonly CategorizationResult[],
): string[] {
  const set = new Set<string>();
  for (const r of results) {
    if (r.transaction.type !== "debit") continue;
    set.add(transactionMonth(r.transaction));
  }
  return [...set].sort();
}
