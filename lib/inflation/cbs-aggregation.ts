import {
  CbsDataNotAvailableError,
  type CategoryCode,
  type CbsInflationProvider,
} from "@/lib/cbs/types";

/**
 * Spending-weighted CBS year-over-year rate for one category, across the
 * months in which the user actually had spending in that category.
 *
 * For a single month the result equals that month's CBS rate. For multiple
 * months each month's CBS rate is weighted by the user's spending in that
 * (category, month) — so a more expensive month for category 11 pulls the
 * CBS-11 rate more.
 *
 * Months without CBS data are skipped (caller is informed via the returned
 * `missingMonths` list) so a partial CBS coverage still yields a sensible
 * rate. If *every* month is missing CBS data the function returns `null`.
 */
export interface WeightedCbsResult {
  /** Weighted year-over-year rate in %, or `null` if no data was available. */
  rate: number | null;
  /** Months that were skipped because CBS had no data for them. */
  missingMonths: string[];
}

export async function getWeightedCbsRate(
  category: CategoryCode,
  monthlySpending: ReadonlyMap<string, number>,
  cbsProvider: CbsInflationProvider,
): Promise<WeightedCbsResult> {
  let numerator = 0;
  let denominator = 0;
  const missingMonths: string[] = [];

  // Sorted iteration keeps the diagnostic warning stable and the unit-tests
  // deterministic across Node versions.
  const months = [...monthlySpending.keys()].sort();

  for (const month of months) {
    const spending = monthlySpending.get(month) ?? 0;
    if (spending <= 0) continue;
    try {
      const rates = await cbsProvider.getMonthlyRates(month);
      const rate = rates[category];
      if (typeof rate !== "number") {
        missingMonths.push(month);
        continue;
      }
      numerator += spending * rate;
      denominator += spending;
    } catch (err) {
      if (err instanceof CbsDataNotAvailableError) {
        missingMonths.push(month);
        // eslint-disable-next-line no-console
        console.warn(
          `[inflation] CBS data missing for ${month} (category ${category}), skipping`,
        );
        continue;
      }
      throw err;
    }
  }

  if (denominator === 0) {
    return { rate: null, missingMonths };
  }

  return { rate: numerator / denominator, missingMonths };
}
