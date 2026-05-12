import type { CategorizedTransaction, CoicopCode, Transaction } from "@/lib/types";

/** Assigns COICOP categories to transactions. */
export interface Categorizer {
  categorize(transactions: Transaction[]): CategorizedTransaction[];
}

/** A single keyword rule mapping a substring to a COICOP code. */
export interface KeywordRule {
  /** Lower-cased substring searched for in counterparty / description. */
  match: string;
  /** COICOP code assigned when this rule matches. */
  coicop: CoicopCode;
  /** Confidence assigned when this rule matches, 0..1. */
  weight: number;
}
