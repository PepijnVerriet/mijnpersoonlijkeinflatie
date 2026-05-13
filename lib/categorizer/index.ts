import type { Transaction } from "@/lib/parsers/types";
import { KEYWORDS } from "./keywords";
import { matchKeyword } from "./keyword-matcher";
import type { CategorizationResult } from "./types";
import { categorizeWithAi } from "./ai";
import { InMemoryCache, type AiCache } from "./ai/cache";
import { mockAiProvider } from "./ai/mock-provider";
import type { AiProvider } from "./ai/types";

export interface CategorizeOptions {
  /** Override the AI provider (default: mock). */
  aiProvider?: AiProvider;
  /** Override the AI cache (default: in-memory). */
  cache?: AiCache;
}

/**
 * Categorise transactions via the two-layer pipeline (CLAUDE.md principle 9):
 *   1) keyword match
 *   2) AI fallback for keyword misses
 *
 * Defaults to the mock AI provider and an in-memory cache, so tests and
 * ad-hoc callers never need network access or an API key. Pass `options`
 * to plug in the real Anthropic provider + the on-disk cache.
 *
 * Output preserves input order; one result per input transaction.
 */
export async function categorizeTransactions(
  transactions: Transaction[],
  options: CategorizeOptions = {},
): Promise<CategorizationResult[]> {
  const results = transactions.map((t) => matchKeyword(t, KEYWORDS));

  const fallbackIndices: number[] = [];
  const fallbackTransactions: Transaction[] = [];
  for (let i = 0; i < results.length; i++) {
    if (results[i].category === null) {
      fallbackIndices.push(i);
      fallbackTransactions.push(transactions[i]);
    }
  }

  if (fallbackTransactions.length === 0) return results;

  const provider = options.aiProvider ?? mockAiProvider;
  const cache = options.cache ?? new InMemoryCache();
  const aiVerdicts = await categorizeWithAi(fallbackTransactions, provider, cache);

  for (let j = 0; j < fallbackIndices.length; j++) {
    const verdict = aiVerdicts.get(j) ?? "unknown";
    const originalIndex = fallbackIndices[j];
    results[originalIndex] = {
      transaction: transactions[originalIndex],
      category: verdict === "unknown" ? null : verdict,
      source: "ai",
    };
  }

  return results;
}

export { KEYWORDS } from "./keywords";
export { matchKeyword, buildHaystack, normalizeText } from "./keyword-matcher";
export type { CategorizationResult, KeywordRule } from "./types";
