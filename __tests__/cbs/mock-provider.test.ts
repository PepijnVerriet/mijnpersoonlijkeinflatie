import { describe, expect, it } from "vitest";
import {
  AVAILABLE_HEADLINE_MONTHS,
  AVAILABLE_MONTHS,
  getMockRatesRaw,
  mockProvider,
} from "@/lib/cbs/mock-provider";
import { CATEGORY_CODES } from "@/lib/cbs/categories";
import { CbsDataNotAvailableError } from "@/lib/cbs/types";
import rawRates from "@/lib/cbs/data/mock-rates.json";
import rawHeadlines from "@/lib/cbs/data/mock-headlines.json";

describe("mockProvider.getMonthlyRates", () => {
  it("returns all twelve category codes for 2025-04", async () => {
    const rates = await mockProvider.getMonthlyRates("2025-04");
    const keys = Object.keys(rates).sort();
    expect(keys).toEqual([...CATEGORY_CODES].sort());
  });

  it("returns numeric values for every code", async () => {
    const rates = await mockProvider.getMonthlyRates("2025-04");
    for (const code of CATEGORY_CODES) {
      expect(typeof rates[code]).toBe("number");
      expect(Number.isFinite(rates[code])).toBe(true);
    }
  });

  it("matches the values in mock-rates.json exactly", async () => {
    const rates = await mockProvider.getMonthlyRates("2025-04");
    expect(rates).toEqual((rawRates as Record<string, unknown>)["2025-04"]);
  });

  it("throws CbsDataNotAvailableError for an unknown month", async () => {
    await expect(mockProvider.getMonthlyRates("2099-12")).rejects.toBeInstanceOf(
      CbsDataNotAvailableError,
    );
  });

  it("throws CbsDataNotAvailableError for malformed input", async () => {
    await expect(mockProvider.getMonthlyRates("not-a-month")).rejects.toBeInstanceOf(
      CbsDataNotAvailableError,
    );
    await expect(mockProvider.getMonthlyRates("2025-13")).rejects.toBeInstanceOf(
      CbsDataNotAvailableError,
    );
  });

  it("returns a defensive copy", async () => {
    const a = await mockProvider.getMonthlyRates("2025-04");
    const before = a["04"];
    a["04"] = 999;
    const b = await mockProvider.getMonthlyRates("2025-04");
    expect(b["04"]).toBe(before);
  });
});

describe("mock-rates.json coverage", () => {
  it("covers 2024-01 through 2025-04 (16 consecutive months)", () => {
    const expected = [
      "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06",
      "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12",
      "2025-01", "2025-02", "2025-03", "2025-04",
    ];
    expect(AVAILABLE_MONTHS).toEqual(expected);
  });

  it("has a rate for every category in every month", () => {
    const rates = getMockRatesRaw();
    for (const month of Object.keys(rates)) {
      for (const code of CATEGORY_CODES) {
        expect(
          rates[month][code],
          `missing rate for ${code} in ${month}`,
        ).toBeDefined();
      }
    }
  });

  it("contains the _comment metadata field", () => {
    expect((rawRates as Record<string, unknown>)._comment).toMatch(
      /Plausibele maar fictieve/,
    );
  });

  it("keeps category 08 (Communicatie) consistently low (0..2%)", () => {
    const rates = getMockRatesRaw();
    for (const month of Object.keys(rates)) {
      const r = rates[month]["08"];
      expect(r, `08 in ${month}`).toBeGreaterThanOrEqual(0);
      expect(r, `08 in ${month}`).toBeLessThanOrEqual(2);
    }
  });

  it("keeps category 11 (Horeca) elevated (4..7%)", () => {
    const rates = getMockRatesRaw();
    for (const month of Object.keys(rates)) {
      const r = rates[month]["11"];
      expect(r, `11 in ${month}`).toBeGreaterThanOrEqual(4);
      expect(r, `11 in ${month}`).toBeLessThanOrEqual(7);
    }
  });

  it("shows category 04 (Wonen & energie) peaking early 2024 and declining", () => {
    const rates = getMockRatesRaw();
    const jan2024 = rates["2024-01"]["04"];
    const apr2025 = rates["2025-04"]["04"];
    expect(jan2024).toBeGreaterThan(8); // early-2024 peak
    expect(apr2025).toBeLessThan(jan2024); // overall decline
  });
});

describe("mockProvider.getMonthlyHeadline", () => {
  it("returns the headline for a known month", async () => {
    // Echte CBS-waarde voor april 2025 (T001112, jaarmutatie).
    const headline = await mockProvider.getMonthlyHeadline("2025-04");
    expect(headline).toBe(4.0);
  });

  it("matches the JSON fixture exactly", async () => {
    const headline = await mockProvider.getMonthlyHeadline("2024-12");
    expect(headline).toBe(
      (rawHeadlines as { headlines: Record<string, number> }).headlines["2024-12"],
    );
  });

  it("throws CbsDataNotAvailableError for an unknown month", async () => {
    await expect(
      mockProvider.getMonthlyHeadline("2099-12"),
    ).rejects.toBeInstanceOf(CbsDataNotAvailableError);
  });

  it("throws CbsDataNotAvailableError for malformed input", async () => {
    await expect(
      mockProvider.getMonthlyHeadline("not-a-month"),
    ).rejects.toBeInstanceOf(CbsDataNotAvailableError);
  });
});

describe("mock-headlines.json coverage", () => {
  it("covers every month that mock-rates.json covers", () => {
    for (const month of AVAILABLE_MONTHS) {
      expect(
        AVAILABLE_HEADLINE_MONTHS.includes(month),
        `headline missing for ${month}`,
      ).toBe(true);
    }
  });

  it("contains real CBS values (sanity-check against known points)", () => {
    const h = (rawHeadlines as { headlines: Record<string, number> }).headlines;
    // Sanity-check op enkele bekende echte CBS-waardes (live opgehaald).
    expect(h["2024-04"]).toBe(2.7);
    expect(h["2024-12"]).toBe(4.1);
    expect(h["2025-04"]).toBe(4.0);
  });
});
