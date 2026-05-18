import type { CategoryCode } from "@/lib/cbs/types";
import type { Transaction } from "@/lib/parsers/types";
import type { AiProvider } from "./types";

const SUGGEST_BATCH_SIZE = 10;
const SUGGESTION_FALLBACK: CategoryCode = "13";

/**
 * Best-guess categorisation for items that landed in the "unknown" bucket.
 *
 * Calls `provider.suggestBatch` in batches of {@link SUGGEST_BATCH_SIZE}.
 * Falls back to running `categorizeBatch` and substituting any leftover
 * "unknown" with category 13 when the provider does not implement
 * `suggestBatch` (or when the call throws). The returned map is keyed on
 * the *original* index in the input array, mirroring `categorizeWithAi`.
 *
 * Per CLAUDE.md principle 20 this never returns "unknown" — every input
 * gets a concrete CategoryCode so the UI dropdown always has a default.
 *
 * Per CLAUDE.md principle 21 we deliberately do NOT consult or update the
 * global AI cache here: suggestions are a fresh attempt every time, and
 * baking them into the global cache could pollute it across users.
 */
export async function suggestCategories(
  transactions: readonly Transaction[],
  provider: AiProvider,
): Promise<Map<number, CategoryCode>> {
  const out = new Map<number, CategoryCode>();
  if (transactions.length === 0) return out;

  for (let start = 0; start < transactions.length; start += SUGGEST_BATCH_SIZE) {
    const slice = transactions.slice(start, start + SUGGEST_BATCH_SIZE);
    const items = slice.map((t, i) => ({
      transactionId: String(start + i),
      merchant: t.merchant,
      counterpartyName: t.counterpartyName,
      description: t.description,
    }));

    let byId = new Map<string, CategoryCode>();
    try {
      if (provider.suggestBatch) {
        const responses = await provider.suggestBatch(items);
        for (const r of responses) {
          byId.set(r.transactionId, r.category);
        }
      } else {
        const responses = await provider.categorizeBatch(items);
        for (const r of responses) {
          byId.set(
            r.transactionId,
            r.category === "unknown" ? SUGGESTION_FALLBACK : r.category,
          );
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[suggest] provider call failed, using fallback", err);
      byId = new Map();
    }

    for (const item of items) {
      const idx = Number(item.transactionId);
      out.set(idx, byId.get(item.transactionId) ?? SUGGESTION_FALLBACK);
    }
  }

  return out;
}
