import type { CategorizedTransaction, Transaction } from "@/lib/types";
import type { Categorizer, KeywordRule } from "./types";

/** Initial keyword rules. Extend as coverage grows. */
export const keywordRules: readonly KeywordRule[] = [
  // TODO: add keyword -> COICOP rules, e.g. { match: "albert heijn", coicop: "01", weight: 0.9 }
];

/** Categorizer that assigns COICOP codes via keyword matching. */
export const keywordCategorizer: Categorizer = {
  categorize(_transactions: Transaction[]): CategorizedTransaction[] {
    throw new Error("Not implemented");
  },
};

export type { Categorizer, KeywordRule } from "./types";
