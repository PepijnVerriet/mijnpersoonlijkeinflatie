import type { Transaction } from "@/lib/parsers/types";
import type { CategoryCode } from "@/lib/cbs/types";

/**
 * Outcome of categorising a single transaction.
 *
 * `category` is `null` when no keyword rule matched. Per CLAUDE.md principle 9
 * such transactions are the input for the AI-fallback layer (module 4c-2);
 * until that lands they are simply uncategorised.
 */
export interface CategorizationResult {
  transaction: Transaction;
  category: CategoryCode | null;
  /** Who made the assignment. `keyword` is also used when category is null. */
  source: "keyword" | "ai" | "user";
  /** Which keyword fired (for debugging / explainability). */
  matchedKeyword?: string;
}

/**
 * A single keyword → category rule.
 *
 * `keyword` is matched case-insensitively and with diacritics folded
 * (so "univé" matches "Unive" and vice-versa). The matcher uses
 * word-boundary matching, so short keys like "ah" or "cz" are safe.
 *
 * Order matters: when more than one rule could match, the *first* rule
 * in the array wins. List specific rules before generic ones.
 */
export interface KeywordRule {
  keyword: string;
  category: CategoryCode;
  /** Optional note explaining why this rule is justified. */
  note?: string;
}
