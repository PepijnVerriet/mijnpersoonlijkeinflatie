import type { CategoryCode } from "@/lib/cbs/types";

/**
 * What the AI may return for a single transaction.
 *
 * - A `CategoryCode` (01..12) when the AI is confident.
 * - `"unknown"` when the AI cannot reasonably guess; the UI will prompt
 *   the user to choose manually.
 *
 * No numerical confidence scores — see CLAUDE.md principle 11.
 */
export type AiCategoryResult = CategoryCode | "unknown";

/** Single transaction sent to the AI (minimal, no amounts / dates / IBANs). */
export interface AiCategorizationItem {
  /** Stable id within the current request — typically the array index. */
  transactionId: string;
  merchant: string | null;
  counterpartyName: string | null;
  description: string;
}

/** AI verdict for one transaction. */
export interface AiCategorizationResponse {
  transactionId: string;
  category: AiCategoryResult;
}

/**
 * Response when explicitly asking the AI for a *best-guess* category
 * (`suggestBatch`). By contract this never returns `"unknown"` — callers
 * use this surface when they want a concrete suggestion to show the user.
 */
export interface AiSuggestionResponse {
  transactionId: string;
  category: CategoryCode;
}

/** Pluggable AI categorisation provider. */
export interface AiProvider {
  /** Categorise a batch of at most 10 transactions (CLAUDE.md principle 11). */
  categorizeBatch(items: AiCategorizationItem[]): Promise<AiCategorizationResponse[]>;

  /**
   * Optional: produce best-guess categories for items the keyword + standard
   * AI layers couldn't decide on. Used by the correction screen (module
   * 4e-1b). Implementations MUST NOT return `"unknown"` here — the contract
   * with the UI is that every returned item has a concrete `CategoryCode`,
   * so the user dropdown always has a sensible default. Top-level callers
   * fall back to `"12"` when a provider omits this method.
   */
  suggestBatch?(items: AiCategorizationItem[]): Promise<AiSuggestionResponse[]>;
}
