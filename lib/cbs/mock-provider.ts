import rawRates from "./data/mock-rates.json";
import rawHeadlines from "./data/mock-headlines.json";
import { CATEGORY_CODES } from "./categories";
import {
  CbsDataNotAvailableError,
  type CategoryRates,
  type CbsInflationProvider,
} from "./types";

/** "YYYY-MM" period regex (01..12). */
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidMonth(month: string): boolean {
  return MONTH_RE.test(month);
}

/**
 * Index of available months → rates, derived from the JSON.
 * Keys starting with "_" (e.g. `_comment`) are treated as metadata and skipped.
 */
const RATES: Readonly<Record<string, CategoryRates>> = Object.freeze(
  Object.fromEntries(
    Object.entries(rawRates as Record<string, unknown>).filter(
      ([key]) => !key.startsWith("_"),
    ),
  ) as Record<string, CategoryRates>,
);

/** All months present in the mock dataset, sorted ascending. */
export const AVAILABLE_MONTHS: readonly string[] = Object.keys(RATES).sort();

const HEADLINES: Readonly<Record<string, number>> = Object.freeze(
  (rawHeadlines as { headlines: Record<string, number> }).headlines,
);

/** All months for which we have a mocked headline, sorted ascending. */
export const AVAILABLE_HEADLINE_MONTHS: readonly string[] =
  Object.keys(HEADLINES).sort();

export const mockProvider: CbsInflationProvider = {
  async getMonthlyRates(month: string): Promise<CategoryRates> {
    if (!isValidMonth(month)) {
      throw new CbsDataNotAvailableError(month);
    }
    const rates = RATES[month];
    if (!rates) {
      throw new CbsDataNotAvailableError(month);
    }
    // Defensive copy so callers can't mutate the cached dataset.
    return { ...rates };
  },

  async getMonthlyHeadline(month: string): Promise<number> {
    if (!isValidMonth(month)) {
      throw new CbsDataNotAvailableError(month);
    }
    const headline = HEADLINES[month];
    if (typeof headline !== "number") {
      throw new CbsDataNotAvailableError(month);
    }
    return headline;
  },
};

/** Exposed for tests: assert the JSON is structurally complete. */
export function getMockRatesRaw(): Readonly<Record<string, CategoryRates>> {
  return RATES;
}

export { CATEGORY_CODES };
