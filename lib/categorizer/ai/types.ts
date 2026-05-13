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

/** Pluggable AI categorisation provider. */
export interface AiProvider {
  /** Categorise a batch of at most 10 transactions (CLAUDE.md principle 11). */
  categorizeBatch(items: AiCategorizationItem[]): Promise<AiCategorizationResponse[]>;
}
