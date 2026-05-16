import { describe, expect, it } from "vitest";
import {
  CBS_BASE_URL,
  CBS_TABLE_ID,
  categoryCodeToCbsKey,
  cbsKeyToCategoryCode,
} from "@/lib/cbs/coicop-mapping";
import { CATEGORY_CODES } from "@/lib/cbs/categories";
import type { CategoryCode } from "@/lib/cbs/types";

describe("constants", () => {
  it("targets CBS table 86141NED (CPI 2025=100)", () => {
    expect(CBS_TABLE_ID).toBe("86141NED");
  });

  it("uses the official CBS OData v3 base URL", () => {
    expect(CBS_BASE_URL).toBe("https://opendata.cbs.nl/ODataApi/odata");
  });
});

describe("categoryCodeToCbsKey", () => {
  it("maps codes 01..13 to CPIxx0000 keys", () => {
    const expected: Record<string, string> = {
      "01": "CPI010000", "02": "CPI020000", "03": "CPI030000",
      "04": "CPI040000", "05": "CPI050000", "06": "CPI060000",
      "07": "CPI070000", "08": "CPI080000", "09": "CPI090000",
      "10": "CPI100000", "11": "CPI110000", "12": "CPI120000",
      "13": "CPI130000",
    };
    for (const [code, key] of Object.entries(expected)) {
      expect(categoryCodeToCbsKey(code as CategoryCode)).toBe(key);
    }
  });

  it("retourneert null voor system-only categorie 14", () => {
    expect(categoryCodeToCbsKey("14")).toBeNull();
  });
});

describe("cbsKeyToCategoryCode", () => {
  it("maps CPIxx0000 keys back to codes 01..13", () => {
    const cases: [string, CategoryCode][] = [
      ["CPI010000", "01"], ["CPI020000", "02"], ["CPI030000", "03"],
      ["CPI040000", "04"], ["CPI050000", "05"], ["CPI060000", "06"],
      ["CPI070000", "07"], ["CPI080000", "08"], ["CPI090000", "09"],
      ["CPI100000", "10"], ["CPI110000", "11"], ["CPI120000", "12"],
      ["CPI130000", "13"],
    ];
    for (const [key, code] of cases) {
      expect(cbsKeyToCategoryCode(key)).toBe(code);
    }
  });

  it("retourneert null voor CBS 140000 (consumptiegebonden belastingen, andere semantiek)", () => {
    expect(cbsKeyToCategoryCode("CPI140000")).toBeNull();
  });

  it("retourneert null voor CBS 150000 (consumptie buitenland, niet gebruikt)", () => {
    expect(cbsKeyToCategoryCode("CPI150000")).toBeNull();
  });

  it("retourneert null voor sub-categorieën (bijv. CPI011000)", () => {
    expect(cbsKeyToCategoryCode("CPI011000")).toBeNull();
    expect(cbsKeyToCategoryCode("CPI072210")).toBeNull();
  });

  it("retourneert null voor de totaal-key 'T001112  '", () => {
    expect(cbsKeyToCategoryCode("T001112  ")).toBeNull();
  });

  it("retourneert null voor garbage input", () => {
    expect(cbsKeyToCategoryCode("")).toBeNull();
    expect(cbsKeyToCategoryCode("010000")).toBeNull(); // mist prefix
    expect(cbsKeyToCategoryCode("CPI99")).toBeNull();
    expect(cbsKeyToCategoryCode("not a key")).toBeNull();
  });
});

describe("round-trip", () => {
  it("forward → reverse herstelt elke user-facing code", () => {
    for (const code of CATEGORY_CODES) {
      const key = categoryCodeToCbsKey(code);
      if (key === null) continue; // 14 heeft geen CBS-key
      expect(cbsKeyToCategoryCode(key)).toBe(code);
    }
  });
});
