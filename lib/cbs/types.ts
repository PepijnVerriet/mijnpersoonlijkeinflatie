import type { CoicopCode } from "@/lib/types";

/**
 * COICOP top-level code (01..12). Alias of the shared `CoicopCode` so the
 * CBS module can be read standalone while staying in sync with the
 * project-wide type used by the categorizer.
 */
export type CategoryCode = CoicopCode;

/** Year-over-year inflation rate (percentage points) per COICOP category. */
export type CategoryRates = Record<CategoryCode, number>;

/** Display metadata for a COICOP top-level category. */
export interface CategoryMetadata {
  code: CategoryCode;
  /** Officiële Nederlandse naam, bijv. "Voeding en alcoholvrije dranken". */
  name: string;
  /** Korte vorm voor de UI, bijv. "Voeding". */
  shortName: string;
  /**
   * Marks a project-internal category that should never reach the user
   * (no dropdown option, no breakdown row). Used for taxes and other
   * non-consumption flows that are filtered out before inflation maths.
   */
  systemOnly?: boolean;
}

/**
 * Data layer for monthly CBS year-over-year CPI rates per COICOP category.
 *
 * Implementations may read mock data or call the CBS OData API
 * (table 86141NED, CPI 2025=100). The contract is the same: one rate per
 * category for the requested month, where the rate is the year-on-year
 * change compared with the same month one year earlier.
 */
export interface CbsInflationProvider {
  /**
   * @param month Period in "YYYY-MM" form, e.g. "2025-04".
   * @throws {CbsDataNotAvailableError} if the month is not available.
   */
  getMonthlyRates(month: string): Promise<CategoryRates>;
  /**
   * Year-over-year change of the headline CPI (CBS table 86141NED key
   * `T001112`) for the requested month, in percent. This is the official
   * "Nederlandse inflatie" figure, basket-weighted by CBS — distinct from
   * the per-category rates above.
   *
   * @param month Period in "YYYY-MM" form, e.g. "2025-04".
   * @throws {CbsDataNotAvailableError} if the month is not available.
   */
  getMonthlyHeadline(month: string): Promise<number>;
}

/** Thrown when a provider has no data for the requested month. */
export class CbsDataNotAvailableError extends Error {
  readonly month: string;
  constructor(month: string) {
    super(`CBS data not available for month ${month}`);
    this.name = "CbsDataNotAvailableError";
    this.month = month;
  }
}
