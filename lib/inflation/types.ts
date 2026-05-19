/**
 * UNIT CONVENTION
 * ---------------
 * Alle inflation rates en weights in dit module zijn in **percent-eenheden**,
 * niet in decimale fracties. `4.2` betekent 4,2%, niet 420%. Dit is consistent
 * met de CBS-data (zie `lib/cbs/data/mock-rates.json`) en met wat de UI toont.
 *
 * Persoonlijke gewichten in `CategoryBreakdown.weight` zijn de uitzondering:
 * dat zijn fracties (0..1) zodat ze sommeren tot ~1.0 en `weight × cbsRate`
 * direct een percent-bijdrage oplevert. `uncategorizedRatio` is om historische
 * redenen ook een fractie (0..1, count-based). De nieuwere `uncategorizedSpendingPct`
 * volgt wél de percent-conventie.
 */
import type { CategoryCode } from "@/lib/cbs/types";

/** Per-category line in an inflation calculation. */
export interface CategoryBreakdown {
  category: CategoryCode;
  /** Total euros spent in this category over the included months. */
  spending: number;
  /** Personal weight: share of total CBS-eligible spending. 0..1. */
  weight: number;
  /** Spending-weighted year-over-year CBS rate for this category, in %. */
  cbsRate: number;
  /** Contribution to `totalInflation`: `weight × cbsRate`, in %. */
  contribution: number;
  /** Number of categorised transactions feeding this line. */
  transactionCount: number;
}

/**
 * Result of a personal inflation calculation. All percentage fields are in
 * percent-units (see the file-level unit convention).
 */
export interface InflationCalculation {
  /** Personal year-over-year inflation, in %. */
  totalInflation: number;
  /** Total euros of categorised spending in CBS-covered categories. */
  totalSpending: number;
  /** Number of categories that ended up in the breakdown. */
  categoriesUsed: number;
  /** Fraction of input transactions that stayed uncategorised (0..1). */
  uncategorizedRatio: number;
  /** Total euros tied to uncategorised transactions (`category===null`). */
  uncategorizedSpending: number;
  /**
   * Fractie van uitgegeven euro's die niet meegerekend zijn in de
   * inflatieberekening, in **percent-eenheden** (`47.0` = 47%, niet `0.47`).
   *
   * Verschilt van `uncategorizedRatio`: die is count-based (transacties),
   * deze is euro-based (geld). Eén dure ongecategoriseerde huurbetaling
   * kan de euro-ratio drastisch verschuiven terwijl de count-ratio
   * nauwelijks beweegt — daarom beide blootstellen.
   */
  uncategorizedSpendingPct: number;
  /** Calendar months represented in the input, sorted ascending. */
  monthsIncluded: string[];
  /**
   * Per-category breakdown, sorted by `contribution` descending (largest
   * contribution first, including negative contributions at the bottom).
   */
  breakdown: CategoryBreakdown[];
  /**
   * Categories where the user had spending but CBS had no data for any
   * relevant month. Their spending is still part of `totalSpending` so the
   * user can see their real expenses, but they are excluded from the
   * inflation maths and from `breakdown`.
   */
  categoriesWithoutCbsData: CategoryCode[];
  /** Euros tied to those CBS-missing categories. */
  spendingWithoutCbsData: number;
  /**
   * Official CBS headline year-over-year inflation over the same months.
   * Sourced from CBS table 86141NED key `T001112` (basket-weighted total).
   * Computed as a simple arithmetic mean of the monthly headlines across
   * `monthsIncluded`. `undefined` when no headline data is available
   * (e.g. mock months without headlines, or CBS unreachable).
   */
  referenceInflation?: number;
}

/** Thrown when there is too little signal to produce a reliable result. */
export class InsufficientDataError extends Error {
  readonly categorizedCount: number;
  readonly minRequired: number;

  constructor(message: string, categorizedCount: number, minRequired: number) {
    super(message);
    this.name = "InsufficientDataError";
    this.categorizedCount = categorizedCount;
    this.minRequired = minRequired;
  }
}
