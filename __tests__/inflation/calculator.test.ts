import { describe, expect, it } from "vitest";
import {
  calculateInflation,
  DEFAULT_MIN_TRANSACTIONS,
} from "@/lib/inflation/calculator";
import { InsufficientDataError } from "@/lib/inflation/types";
import type { CategorizationResult } from "@/lib/categorizer/types";
import {
  CbsDataNotAvailableError,
  type CategoryCode,
  type CategoryRates,
  type CbsInflationProvider,
} from "@/lib/cbs/types";
import type { Transaction } from "@/lib/parsers/types";

function tx(
  amount: number,
  date: Date,
  partial: Partial<Transaction> = {},
): Transaction {
  return {
    date,
    amount,
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

function res(
  amount: number,
  date: Date,
  category: CategoryCode | null,
): CategorizationResult {
  return {
    transaction: tx(amount, date),
    category,
    source: category ? "keyword" : "ai",
  };
}

/** Build N results, all in 2025-04. */
function fillMonth(
  n: number,
  perTxAmount: number,
  category: CategoryCode | null,
): CategorizationResult[] {
  const out: CategorizationResult[] = [];
  for (let i = 0; i < n; i++) {
    out.push(res(perTxAmount, new Date(2025, 3, 1 + (i % 28)), category));
  }
  return out;
}

function staticProvider(
  table: Record<string, Partial<CategoryRates>>,
): CbsInflationProvider {
  return {
    async getMonthlyRates(month) {
      const rates = table[month];
      if (!rates) throw new CbsDataNotAvailableError(month);
      return rates as CategoryRates;
    },
  };
}

describe("calculateInflation — golden case (hand-computed)", () => {
  it("calculates total inflation from fixed inputs", async () => {
    // 15× €100/15 in cat 01, 5× €60/5 in cat 07, all in 2025-04.
    // Cat 01 total = 100, cat 07 total = 60, grand total = 160
    // CBS rates for 2025-04: 01=3.3, 07=3.0 (custom provider for stability)
    // weight 01 = 100/160 = 0.625, weight 07 = 60/160 = 0.375
    // contribution 01 = 0.625 * 3.3 = 2.0625
    // contribution 07 = 0.375 * 3.0 = 1.125
    // total = 3.1875
    const inputs = [
      ...fillMonth(15, 100 / 15, "01"),
      ...fillMonth(5, 60 / 5, "07"),
    ];
    const cbs = staticProvider({
      "2025-04": { "01": 3.3, "07": 3.0 },
    });

    const out = await calculateInflation(inputs, { cbsProvider: cbs });

    expect(out.totalInflation).toBeCloseTo(3.1875, 6);
    expect(out.totalSpending).toBeCloseTo(160, 6);
    expect(out.categoriesUsed).toBe(2);
    expect(out.uncategorizedRatio).toBe(0);
    expect(out.uncategorizedSpending).toBe(0);
    expect(out.monthsIncluded).toEqual(["2025-04"]);
    expect(out.spendingWithoutCbsData).toBe(0);
    expect(out.categoriesWithoutCbsData).toEqual([]);

    // breakdown sorted by contribution descending
    expect(out.breakdown.map((b) => b.category)).toEqual(["01", "07"]);
    expect(out.breakdown[0].weight).toBeCloseTo(0.625, 6);
    expect(out.breakdown[1].weight).toBeCloseTo(0.375, 6);
  });
});

describe("calculateInflation — edge cases", () => {
  it("100% in one category gives totalInflation == that category's CBS rate", async () => {
    const inputs = fillMonth(20, 10, "01"); // €200 total, all cat 01
    const cbs = staticProvider({ "2025-04": { "01": 3.3 } });

    const out = await calculateInflation(inputs, { cbsProvider: cbs });

    expect(out.totalInflation).toBeCloseTo(3.3, 6);
    expect(out.categoriesUsed).toBe(1);
    expect(out.breakdown[0].weight).toBe(1.0);
    expect(out.breakdown[0].contribution).toBeCloseTo(3.3, 6);
  });

  it("includes unknown transactions in uncategorizedRatio / Spending", async () => {
    const inputs = [
      ...fillMonth(20, 10, "01"), // €200 categorized
      ...fillMonth(5, 50, null), // 5× €50 = €250 unknown
    ];
    const cbs = staticProvider({ "2025-04": { "01": 3 } });

    const out = await calculateInflation(inputs, { cbsProvider: cbs });

    expect(out.uncategorizedRatio).toBeCloseTo(5 / 25, 6);
    expect(out.uncategorizedSpending).toBeCloseTo(250, 6);
    expect(out.totalSpending).toBeCloseTo(200, 6); // unknown NOT in total
  });

  it("exposes uncategorizedSpendingPct that diverges sharply from the count-based ratio", async () => {
    // 20× €1 categorized (€20), 2× €500 unknown (€1000).
    // count-based: 2/22 ≈ 9.1% uncategorised
    // euro-based:  1000/1020 ≈ 98.04% uncategorised
    const inputs: CategorizationResult[] = [
      ...fillMonth(20, 1, "01"),
      ...fillMonth(2, 500, null),
    ];
    const cbs = staticProvider({ "2025-04": { "01": 3 } });

    const out = await calculateInflation(inputs, { cbsProvider: cbs });

    expect(out.uncategorizedRatio).toBeCloseTo(2 / 22, 4); // ≈ 0.0909
    expect(out.uncategorizedSpendingPct).toBeCloseTo((1000 / 1020) * 100, 4); // ≈ 98.04
    // They must clearly differ — proves both metrics carry distinct signal.
    const ratioInPct = out.uncategorizedRatio * 100;
    expect(out.uncategorizedSpendingPct - ratioInPct).toBeGreaterThan(50);
  });

  it("reports uncategorizedSpendingPct = 0 when nothing is uncategorised", async () => {
    const inputs = fillMonth(20, 10, "01");
    const cbs = staticProvider({ "2025-04": { "01": 3 } });
    const out = await calculateInflation(inputs, { cbsProvider: cbs });
    expect(out.uncategorizedSpendingPct).toBe(0);
  });

  it("breakdown is sorted by contribution descending (negatives at the bottom)", async () => {
    // Three categories: 01 small positive, 07 large positive, 03 negative.
    const inputs = [
      ...fillMonth(10, 10, "01"), // €100
      ...fillMonth(10, 10, "07"), // €100
      ...fillMonth(10, 10, "03"), // €100
    ];
    const cbs = staticProvider({
      "2025-04": { "01": 2.0, "03": -1.0, "07": 4.0 },
    });

    const out = await calculateInflation(inputs, { cbsProvider: cbs });

    // contributions (equal weights of 1/3):
    //   07: 0.333... * 4  =  1.333
    //   01: 0.333... * 2  =  0.667
    //   03: 0.333... * -1 = -0.333
    expect(out.breakdown.map((b) => b.category)).toEqual(["07", "01", "03"]);
    expect(out.breakdown[2].contribution).toBeLessThan(0);
  });

  it("isolates CBS-missing categories into the dedicated fields", async () => {
    // cat 01 covered by CBS, cat 02 not.
    const inputs = [
      ...fillMonth(15, 10, "01"), // €150
      ...fillMonth(5, 10, "02"), // €50
    ];
    const cbs = staticProvider({
      "2025-04": { "01": 3.0 }, // 02 absent
    });

    const out = await calculateInflation(inputs, { cbsProvider: cbs });

    expect(out.categoriesUsed).toBe(1);
    expect(out.breakdown).toHaveLength(1);
    expect(out.breakdown[0].category).toBe("01");
    expect(out.breakdown[0].weight).toBe(1.0); // 02 not in weight base
    expect(out.categoriesWithoutCbsData).toEqual(["02"]);
    expect(out.spendingWithoutCbsData).toBeCloseTo(50, 6);
    expect(out.totalSpending).toBeCloseTo(200, 6); // includes the cat-02 €50
    expect(out.totalInflation).toBeCloseTo(3.0, 6);
  });

  it("multi-month spending uses the spec example (€50 jan + €200 feb → cat 11 = 4.96)", async () => {
    const jan = new Date(2025, 0, 15);
    const feb = new Date(2025, 1, 10);
    // 25 single-euro transactions to clear minTransactions; 100% in cat 11.
    const inputs: CategorizationResult[] = [
      ...Array.from({ length: 5 }, () => res(50 / 5, jan, "11")), // €50 jan
      ...Array.from({ length: 20 }, () => res(200 / 20, feb, "11")), // €200 feb
    ];
    const cbs = staticProvider({
      "2025-01": { "11": 4.8 },
      "2025-02": { "11": 5.0 },
    });

    const out = await calculateInflation(inputs, { cbsProvider: cbs });

    expect(out.monthsIncluded).toEqual(["2025-01", "2025-02"]);
    expect(out.totalInflation).toBeCloseTo(4.96, 6);
    expect(out.breakdown[0].cbsRate).toBeCloseTo(4.96, 6);
  });
});

describe("calculateInflation — InsufficientDataError", () => {
  it("throws when nothing was categorised", async () => {
    const inputs = fillMonth(20, 10, null);
    await expect(
      calculateInflation(inputs, { cbsProvider: staticProvider({}) }),
    ).rejects.toBeInstanceOf(InsufficientDataError);
    await expect(
      calculateInflation(inputs, { cbsProvider: staticProvider({}) }),
    ).rejects.toThrow(/Geen transacties/);
  });

  it("throws when fewer than minTransactions are categorised (default 20)", async () => {
    const inputs = fillMonth(10, 10, "01");
    const cbs = staticProvider({ "2025-04": { "01": 3.0 } });
    await expect(
      calculateInflation(inputs, { cbsProvider: cbs }),
    ).rejects.toBeInstanceOf(InsufficientDataError);
    await expect(
      calculateInflation(inputs, { cbsProvider: cbs }),
    ).rejects.toThrow(/minimaal 20 vereist/);
  });

  it("respects a custom minTransactions override", async () => {
    const inputs = fillMonth(7, 10, "01");
    const cbs = staticProvider({ "2025-04": { "01": 3.0 } });
    const out = await calculateInflation(inputs, {
      cbsProvider: cbs,
      minTransactions: 5,
    });
    expect(out.totalInflation).toBeCloseTo(3.0, 6);
  });

  it("exposes DEFAULT_MIN_TRANSACTIONS as 20", () => {
    expect(DEFAULT_MIN_TRANSACTIONS).toBe(20);
  });
});
