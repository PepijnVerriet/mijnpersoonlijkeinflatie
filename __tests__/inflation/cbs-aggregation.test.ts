import { describe, expect, it, vi } from "vitest";
import { getWeightedCbsRate } from "@/lib/inflation/cbs-aggregation";
import {
  CbsDataNotAvailableError,
  type CategoryRates,
  type CbsInflationProvider,
} from "@/lib/cbs/types";

/** Build a tiny provider from a literal month → rates table. */
function provider(
  table: Record<string, Partial<CategoryRates>>,
): CbsInflationProvider {
  return {
    async getMonthlyRates(month: string): Promise<CategoryRates> {
      const rates = table[month];
      if (!rates) throw new CbsDataNotAvailableError(month);
      return rates as CategoryRates;
    },
  };
}

describe("getWeightedCbsRate", () => {
  it("returns the single month's rate when there's only one month", async () => {
    const cbs = provider({ "2025-04": { "11": 5.4 } });
    const out = await getWeightedCbsRate(
      "11",
      new Map([["2025-04", 200]]),
      cbs,
    );
    expect(out.rate).toBeCloseTo(5.4, 6);
    expect(out.missingMonths).toEqual([]);
  });

  it("collapses to a simple average for equal spending across months", async () => {
    const cbs = provider({
      "2025-01": { "11": 4.8 },
      "2025-02": { "11": 5.0 },
    });
    const out = await getWeightedCbsRate(
      "11",
      new Map([
        ["2025-01", 100],
        ["2025-02", 100],
      ]),
      cbs,
    );
    expect(out.rate).toBeCloseTo(4.9, 6);
  });

  it("uses the spec example: €50 jan + €200 feb → 4.96%", async () => {
    const cbs = provider({
      "2025-01": { "11": 4.8 },
      "2025-02": { "11": 5.0 },
    });
    const out = await getWeightedCbsRate(
      "11",
      new Map([
        ["2025-01", 50],
        ["2025-02", 200],
      ]),
      cbs,
    );
    // (50 * 4.8 + 200 * 5.0) / 250 = (240 + 1000) / 250 = 4.96
    expect(out.rate).toBeCloseTo(4.96, 6);
  });

  it("skips missing CBS months and warns, returning rate from available months", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cbs = provider({
      "2025-01": { "11": 4.8 },
      // 2025-02 absent
    });
    const out = await getWeightedCbsRate(
      "11",
      new Map([
        ["2025-01", 100],
        ["2025-02", 100],
      ]),
      cbs,
    );
    expect(out.rate).toBeCloseTo(4.8, 6);
    expect(out.missingMonths).toEqual(["2025-02"]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("returns null when CBS has no data for any month", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cbs = provider({});
    const out = await getWeightedCbsRate(
      "11",
      new Map([["2025-01", 100]]),
      cbs,
    );
    expect(out.rate).toBeNull();
    expect(out.missingMonths).toEqual(["2025-01"]);
    warn.mockRestore();
  });

  it("ignores months with zero or negative spending", async () => {
    const cbs = provider({
      "2025-01": { "11": 100 },
      "2025-02": { "11": 5 },
    });
    const out = await getWeightedCbsRate(
      "11",
      new Map([
        ["2025-01", 0],
        ["2025-02", 100],
      ]),
      cbs,
    );
    expect(out.rate).toBeCloseTo(5, 6);
  });

  it("re-throws non-CBS errors instead of swallowing them", async () => {
    const cbs: CbsInflationProvider = {
      async getMonthlyRates() {
        throw new Error("network kaboom");
      },
    };
    await expect(
      getWeightedCbsRate("11", new Map([["2025-01", 10]]), cbs),
    ).rejects.toThrow(/network kaboom/);
  });
});
