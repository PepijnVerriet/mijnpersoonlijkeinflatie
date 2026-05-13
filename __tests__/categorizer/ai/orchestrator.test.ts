import { describe, expect, it, vi } from "vitest";
import { AI_BATCH_SIZE, categorizeWithAi } from "@/lib/categorizer/ai";
import { InMemoryCache } from "@/lib/categorizer/ai/cache";
import type { AiProvider } from "@/lib/categorizer/ai/types";
import type { Transaction } from "@/lib/parsers/types";

function tx(partial: Partial<Transaction>): Transaction {
  return {
    date: new Date("2025-04-01"),
    amount: 0,
    type: "debit",
    code: "bc",
    counterpartyIban: null,
    counterpartyName: null,
    description: "",
    merchant: null,
    location: null,
    rawText: "",
    ...partial,
  };
}

/** Build a fake provider that records what it was called with. */
function fakeProvider(
  classify: (merchant: string) => "01" | "07" | "09" | "11" | "12" | "unknown",
): { provider: AiProvider; calls: number; itemCount: number } {
  const state = { calls: 0, itemCount: 0 };
  const provider: AiProvider = {
    async categorizeBatch(items) {
      state.calls += 1;
      state.itemCount += items.length;
      return items.map((it) => ({
        transactionId: it.transactionId,
        category: classify(it.merchant ?? it.counterpartyName ?? it.description),
      }));
    },
  };
  return { provider, get calls() { return state.calls; }, get itemCount() { return state.itemCount; } };
}

describe("categorizeWithAi", () => {
  it("returns a Map keyed on original transaction indices", async () => {
    const txs = [tx({ merchant: "Foo" }), tx({ merchant: "Bar" })];
    const { provider } = fakeProvider(() => "12");
    const out = await categorizeWithAi(txs, provider, new InMemoryCache());
    expect(out.get(0)).toBe("12");
    expect(out.get(1)).toBe("12");
  });

  it("hits the cache and never calls the provider when all keys are cached", async () => {
    const txs = [tx({ merchant: "Foo" }), tx({ merchant: "Bar" })];
    const cache = new InMemoryCache();
    await cache.set("foo", "01");
    await cache.set("bar", "07");

    const fp = fakeProvider(() => "unknown");
    const out = await categorizeWithAi(txs, fp.provider, cache);

    expect(out.get(0)).toBe("01");
    expect(out.get(1)).toBe("07");
    expect(fp.calls).toBe(0);
  });

  it("stores fresh AI results in the cache for next time", async () => {
    const cache = new InMemoryCache();
    const fp = fakeProvider(() => "09");
    await categorizeWithAi([tx({ merchant: "Pathe" })], fp.provider, cache);
    expect(cache.get("pathe")).toBe("09");
  });

  it("does NOT cache iDEAL / Betaalverzoek transactions", async () => {
    const cache = new InMemoryCache();
    const fp = fakeProvider(() => "11");
    await categorizeWithAi(
      [tx({ code: "bv", counterpartyName: "C. Snijers", description: "Stadscafe" })],
      fp.provider,
      cache,
    );
    expect(cache.get("c. snijers")).toBeNull();
    expect(cache.get("")).toBeNull();
  });

  it("splits more than 10 transactions into multiple batches", async () => {
    const txs = Array.from({ length: 23 }, (_, i) => tx({ merchant: `M${i}` }));
    const fp = fakeProvider(() => "12");
    await categorizeWithAi(txs, fp.provider, new InMemoryCache());
    expect(fp.calls).toBe(3); // 10 + 10 + 3
    expect(fp.itemCount).toBe(23);
  });

  it("uses AI_BATCH_SIZE = 10", () => {
    expect(AI_BATCH_SIZE).toBe(10);
  });

  it("falls back to 'unknown' when the provider omits a transactionId", async () => {
    const txs = [tx({ merchant: "Foo" })];
    const provider: AiProvider = {
      async categorizeBatch() {
        return []; // forgot to answer
      },
    };
    const out = await categorizeWithAi(txs, provider, new InMemoryCache());
    expect(out.get(0)).toBe("unknown");
  });

  it("processes cache hits and AI calls in one mixed batch", async () => {
    const cache = new InMemoryCache();
    await cache.set("kpn", "08");

    const txs = [
      tx({ merchant: "KPN" }),
      tx({ merchant: "Unknown Shop" }),
      tx({ merchant: "Other Shop" }),
    ];
    const fp = fakeProvider(() => "12");
    const out = await categorizeWithAi(txs, fp.provider, cache);

    expect(out.get(0)).toBe("08");
    expect(out.get(1)).toBe("12");
    expect(out.get(2)).toBe("12");
    expect(fp.calls).toBe(1);
    expect(fp.itemCount).toBe(2); // KPN came from cache
  });
});
