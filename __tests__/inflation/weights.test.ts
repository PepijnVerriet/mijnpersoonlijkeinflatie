import { describe, expect, it } from "vitest";
import {
  calculateWeights,
  groupByCategory,
  groupByMonth,
  monthsIncluded,
  transactionMonth,
} from "@/lib/inflation/weights";
import type { CategorizationResult } from "@/lib/categorizer/types";
import type { CategoryCode } from "@/lib/cbs/types";
import type { Transaction } from "@/lib/parsers/types";

function tx(partial: Partial<Transaction>): Transaction {
  return {
    date: new Date(2025, 3, 1), // 1 april 2025 (local)
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

function result(
  amount: number,
  category: CategoryCode | null,
  partial: Partial<Transaction> = {},
): CategorizationResult {
  return {
    transaction: tx({ amount, ...partial }),
    category,
    source: category ? "keyword" : "ai",
  };
}

describe("transactionMonth", () => {
  it("returns YYYY-MM in local time", () => {
    expect(transactionMonth(tx({ date: new Date(2025, 3, 15) }))).toBe("2025-04");
    expect(transactionMonth(tx({ date: new Date(2024, 0, 1) }))).toBe("2024-01");
    expect(transactionMonth(tx({ date: new Date(2024, 11, 31) }))).toBe("2024-12");
  });
});

describe("groupByCategory", () => {
  it("sums spending and counts per category", () => {
    const out = groupByCategory([
      result(10, "01"),
      result(15, "01"),
      result(50, "11"),
    ]);
    expect(out.get("01")).toEqual({ total: 25, count: 2 });
    expect(out.get("11")).toEqual({ total: 50, count: 1 });
  });

  it("ignores transactions with null category (unknown)", () => {
    const out = groupByCategory([result(100, null), result(20, "01")]);
    expect(out.get("01")).toEqual({ total: 20, count: 1 });
    expect(out.has(null as never)).toBe(false);
    expect(out.size).toBe(1);
  });

  it("ignores credit transactions defensively", () => {
    const out = groupByCategory([
      result(50, "01", { type: "credit" }),
      result(50, "01", { type: "debit" }),
    ]);
    expect(out.get("01")?.total).toBe(50);
  });
});

describe("groupByMonth", () => {
  it("groups spending per (category, month) pair", () => {
    const jan = new Date(2025, 0, 15);
    const feb = new Date(2025, 1, 10);
    const out = groupByMonth([
      result(50, "11", { date: jan }),
      result(200, "11", { date: feb }),
      result(30, "01", { date: feb }),
    ]);
    expect(out.get("11")?.get("2025-01")).toBe(50);
    expect(out.get("11")?.get("2025-02")).toBe(200);
    expect(out.get("01")?.get("2025-02")).toBe(30);
  });
});

describe("calculateWeights", () => {
  it("returns weight 1.0 when all spending is in one category", () => {
    const map = new Map<CategoryCode, number>([["01", 123]]);
    const w = calculateWeights(map);
    expect(w.get("01")).toBeCloseTo(1.0, 6);
    expect(w.size).toBe(1);
  });

  it("splits a 60/40 spread between two categories", () => {
    const map = new Map<CategoryCode, number>([
      ["01", 60],
      ["07", 40],
    ]);
    const w = calculateWeights(map);
    expect(w.get("01")).toBeCloseTo(0.6, 6);
    expect(w.get("07")).toBeCloseTo(0.4, 6);
  });

  it("skips non-positive entries and returns empty for empty input", () => {
    expect(calculateWeights(new Map()).size).toBe(0);
    const map = new Map<CategoryCode, number>([
      ["01", 0],
      ["07", -5],
      ["11", 100],
    ]);
    const w = calculateWeights(map);
    expect(w.size).toBe(1);
    expect(w.get("11")).toBe(1.0);
  });

  it("ignores unknown transactions in the upstream group step", () => {
    const w = calculateWeights(
      // upstream groupByCategory drops nulls; here we simulate the result
      new Map<CategoryCode, number>([["01", 100]]),
    );
    expect(w.get("01")).toBe(1.0);
  });
});

describe("monthsIncluded", () => {
  it("returns sorted unique YYYY-MM keys", () => {
    expect(
      monthsIncluded([
        result(1, "01", { date: new Date(2025, 1, 5) }),
        result(1, "01", { date: new Date(2025, 0, 10) }),
        result(1, "01", { date: new Date(2025, 1, 28) }),
      ]),
    ).toEqual(["2025-01", "2025-02"]);
  });
});
