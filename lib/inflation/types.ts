import type { CoicopCode } from "@/lib/types";

/** Spending weights per COICOP category, derived from the user's transactions. */
export interface SpendingWeights {
  /** Start period the weights were computed over, "YYYY-MM". */
  from: string;
  /** End period the weights were computed over, "YYYY-MM". */
  to: string;
  /** COICOP code -> share of total spending (0..1). Should sum to ~1. */
  weights: Partial<Record<CoicopCode, number>>;
}

/** Result of a personal-inflation calculation. */
export interface PersonalInflationResult {
  /** Personal inflation over the period, as a fraction (0.034 = 3.4%). */
  rate: number;
  /** Per-category contribution to `rate`. */
  contributions: Partial<Record<CoicopCode, number>>;
  /** Official CBS headline inflation over the same period, for comparison. */
  cbsRate: number;
}
