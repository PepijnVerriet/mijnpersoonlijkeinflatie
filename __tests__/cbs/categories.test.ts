import { describe, expect, it } from "vitest";
import { CATEGORIES, CATEGORY_CODES, getCategory } from "@/lib/cbs/categories";

const EXPECTED_CODES = [
  "01", "02", "03", "04", "05", "06",
  "07", "08", "09", "10", "11", "12",
] as const;

describe("CATEGORIES", () => {
  it("has exactly twelve entries", () => {
    expect(CATEGORIES).toHaveLength(12);
  });

  it("covers codes 01..12 in canonical order", () => {
    expect(CATEGORY_CODES).toEqual(EXPECTED_CODES);
  });

  it("has unique codes", () => {
    const codes = CATEGORIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("has a non-empty Dutch name and shortName for every category", () => {
    for (const c of CATEGORIES) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.shortName.length).toBeGreaterThan(0);
    }
  });

  it("uses the official Dutch label for category 04", () => {
    expect(getCategory("04").name).toBe("Wonen, water en energie");
  });

  it("throws when looking up an unknown code", () => {
    expect(() => getCategory("99" as never)).toThrow(/Unknown category/);
  });
});
