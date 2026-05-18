import { describe, expect, it, vi } from "vitest";
import { suggestCategories } from "@/lib/categorizer/ai/suggest";
import { mockAiProvider } from "@/lib/categorizer/ai/mock-provider";
import type { AiProvider } from "@/lib/categorizer/ai/types";
import type { Transaction } from "@/lib/parsers/types";

function tx(partial: Partial<Transaction>): Transaction {
  return {
    date: new Date(2025, 3, 1),
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

describe("suggestCategories — mock provider", () => {
  it("returns an empty map for empty input", async () => {
    const out = await suggestCategories([], mockAiProvider);
    expect(out.size).toBe(0);
  });

  it("returns a category for every transaction (never 'unknown')", async () => {
    const txs = [
      tx({ description: "XYZ Random Shop" }),
      tx({ description: "Biblioth.M.Brabant" }),
      tx({ description: "Bouman" }),
    ];
    const out = await suggestCategories(txs, mockAiProvider);
    expect(out.size).toBe(3);
    for (const cat of out.values()) {
      expect(cat).not.toBe("unknown");
      expect(typeof cat).toBe("string");
    }
  });

  it("substitutes mock 'unknown' verdicts with category 13", async () => {
    const txs = [
      tx({ description: "Bouman" }), // mock returns 'unknown'
      tx({ description: "PayPal Luxembourg" }), // 'unknown'
    ];
    const out = await suggestCategories(txs, mockAiProvider);
    expect(out.get(0)).toBe("13");
    expect(out.get(1)).toBe("13");
  });

  it("preserves the mock's heuristic answers", async () => {
    const out = await suggestCategories(
      [tx({ description: "Bibliotheek Tilburg" })],
      mockAiProvider,
    );
    expect(out.get(0)).toBe("09");
  });
});

describe("suggestCategories — provider variants", () => {
  it("falls back to categorizeBatch + substitute when suggestBatch is absent", async () => {
    const provider: AiProvider = {
      async categorizeBatch(items) {
        return items.map((it) => ({
          transactionId: it.transactionId,
          category: "unknown" as const,
        }));
      },
      // intentionally no suggestBatch
    };
    const out = await suggestCategories([tx({}), tx({})], provider);
    expect(out.get(0)).toBe("13");
    expect(out.get(1)).toBe("13");
  });

  it("falls back to category 13 when the provider throws", async () => {
    const provider: AiProvider = {
      async categorizeBatch() {
        throw new Error("kaboom");
      },
      async suggestBatch() {
        throw new Error("kaboom");
      },
    };
    const out = await suggestCategories([tx({}), tx({})], provider);
    expect(out.get(0)).toBe("13");
    expect(out.get(1)).toBe("13");
  });

  it("splits large inputs into batches of 10", async () => {
    const calls = vi.fn();
    const provider: AiProvider = {
      async categorizeBatch() {
        throw new Error("should not be called");
      },
      async suggestBatch(items) {
        calls(items.length);
        return items.map((it) => ({
          transactionId: it.transactionId,
          category: "11" as const,
        }));
      },
    };

    const txs = Array.from({ length: 23 }, () => tx({}));
    const out = await suggestCategories(txs, provider);

    expect(out.size).toBe(23);
    expect(calls).toHaveBeenCalledTimes(3); // 10 + 10 + 3
    expect(calls.mock.calls.map((c) => c[0])).toEqual([10, 10, 3]);
    for (const cat of out.values()) {
      expect(cat).toBe("11");
    }
  });
});
