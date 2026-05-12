import type { CategorizedTransaction } from "@/lib/types";
import type { CpiDataset } from "@/lib/cbs/types";
import type { PersonalInflationResult, SpendingWeights } from "./types";

/** Derive spending weights per COICOP category from categorized transactions. */
export function computeWeights(
  _transactions: CategorizedTransaction[],
): SpendingWeights {
  throw new Error("Not implemented");
}

/** Combine spending weights with CBS CPI data into a personal inflation figure. */
export function computePersonalInflation(
  _weights: SpendingWeights,
  _cpi: CpiDataset,
): PersonalInflationResult {
  throw new Error("Not implemented");
}

export type { PersonalInflationResult, SpendingWeights } from "./types";
