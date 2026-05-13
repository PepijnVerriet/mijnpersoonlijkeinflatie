import type { Transaction } from "@/lib/parsers/types";
import { KEYWORDS } from "./keywords";
import { matchKeyword } from "./keyword-matcher";
import type { CategorizationResult } from "./types";

/**
 * Categorise a batch of transactions via the keyword layer. Order in the
 * input is preserved. Transactions that no rule matches receive
 * `category: null` and are the input for the AI fallback (module 4c-2).
 */
export function categorizeTransactions(
  transactions: Transaction[],
): CategorizationResult[] {
  return transactions.map((t) => matchKeyword(t, KEYWORDS));
}

export { KEYWORDS } from "./keywords";
export { matchKeyword, buildHaystack, normalizeText } from "./keyword-matcher";
export type { CategorizationResult, KeywordRule } from "./types";
