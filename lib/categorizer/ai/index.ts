import type { Transaction } from "@/lib/parsers/types";
import type { AiCache } from "./cache";
import { cacheKeyFor } from "./cache";
import type { AiCategoryResult, AiProvider } from "./types";

/** Max batch size for AI calls (CLAUDE.md principle 11). */
export const AI_BATCH_SIZE = 10;

interface PendingItem {
  index: number;
  transaction: Transaction;
  /** `null` means do not cache the result (Tikkie / Betaalverzoek). */
  cacheKey: string | null;
}

/**
 * Run the AI-fallback over a (small) list of transactions.
 *
 * For each transaction:
 *  - compute its cache key (`cacheKeyFor`);
 *  - hit the cache when possible;
 *  - else queue the transaction and ask `provider.categorizeBatch` in
 *    batches of `AI_BATCH_SIZE`;
 *  - store fresh results in the cache (skipped when key is `null`).
 *
 * The returned Map is keyed on the *original* index of the transaction in
 * the caller's array. Indices that never reached the AI (none, in practice)
 * are absent from the map.
 */
export async function categorizeWithAi(
  transactions: Transaction[],
  provider: AiProvider,
  cache: AiCache,
): Promise<Map<number, AiCategoryResult>> {
  const out = new Map<number, AiCategoryResult>();
  const pending: PendingItem[] = [];

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    const key = cacheKeyFor(t);
    if (key !== null) {
      const cached = cache.get(key);
      if (cached !== null) {
        out.set(i, cached);
        continue;
      }
    }
    pending.push({ index: i, transaction: t, cacheKey: key });
  }

  for (let start = 0; start < pending.length; start += AI_BATCH_SIZE) {
    const slice = pending.slice(start, start + AI_BATCH_SIZE);
    const responses = await provider.categorizeBatch(
      slice.map((p) => ({
        transactionId: String(p.index),
        merchant: p.transaction.merchant,
        counterpartyName: p.transaction.counterpartyName,
        description: p.transaction.description,
      })),
    );

    const byId = new Map(responses.map((r) => [r.transactionId, r.category]));
    for (const p of slice) {
      const verdict = byId.get(String(p.index)) ?? "unknown";
      out.set(p.index, verdict);
      if (p.cacheKey !== null) {
        await cache.set(p.cacheKey, verdict);
      }
    }
  }

  return out;
}
