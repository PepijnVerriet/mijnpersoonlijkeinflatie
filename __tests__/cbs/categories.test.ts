import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  CATEGORY_CODES,
  USER_FACING_CATEGORIES,
  USER_FACING_CATEGORY_CODES,
  getCategory,
} from "@/lib/cbs/categories";

const EXPECTED_CODES = [
  "01", "02", "03", "04", "05", "06", "07",
  "08", "09", "10", "11", "12", "13", "14",
] as const;

const EXPECTED_USER_FACING_CODES = [
  "01", "02", "03", "04", "05", "06", "07",
  "08", "09", "10", "11", "12", "13",
] as const;

describe("CATEGORIES", () => {
  it("has exactly fourteen entries (COICOP-2018, NL-specifiek)", () => {
    expect(CATEGORIES).toHaveLength(14);
  });

  it("covers codes 01..14 in canonical order", () => {
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

  it("uses the COICOP-2018 label for category 04", () => {
    expect(getCategory("04").name).toBe("Huisvesting en nutsvoorzieningen");
  });

  it("uses the new label for category 12 (Verzekeringen)", () => {
    expect(getCategory("12").name).toBe("Verzekeringen en financiële diensten");
  });

  it("places oude '12 Diverse' op nieuwe code 13", () => {
    expect(getCategory("13").name).toBe("Diverse goederen en diensten");
  });

  it("throws when looking up an unknown code", () => {
    expect(() => getCategory("99" as never)).toThrow(/Unknown category/);
  });
});

describe("system-only categorieën", () => {
  it("markeert categorie 14 (Belastingen) als systemOnly", () => {
    expect(getCategory("14").systemOnly).toBe(true);
  });

  it("heeft géén systemOnly-vlag op de 13 user-facing categorieën", () => {
    for (const code of EXPECTED_USER_FACING_CODES) {
      expect(getCategory(code).systemOnly).toBeUndefined();
    }
  });
});

describe("USER_FACING_CATEGORIES", () => {
  it("heeft exact 13 entries (alle behalve Belastingen)", () => {
    expect(USER_FACING_CATEGORIES).toHaveLength(13);
  });

  it("levert codes 01..13 in canonieke volgorde", () => {
    expect(USER_FACING_CATEGORY_CODES).toEqual(EXPECTED_USER_FACING_CODES);
  });

  it("bevat geen system-only categorieën", () => {
    for (const c of USER_FACING_CATEGORIES) {
      expect(c.systemOnly).toBeFalsy();
    }
  });
});
