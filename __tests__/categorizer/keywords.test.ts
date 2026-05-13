import { describe, expect, it } from "vitest";
import { KEYWORDS } from "@/lib/categorizer/keywords";
import { CATEGORY_CODES } from "@/lib/cbs/categories";
import { normalizeText } from "@/lib/categorizer/keyword-matcher";

const CODES = new Set<string>(CATEGORY_CODES);

describe("KEYWORDS integrity", () => {
  it("has at least 60 entries", () => {
    expect(KEYWORDS.length).toBeGreaterThanOrEqual(60);
  });

  it("has no duplicate keywords (after diacritic-folding)", () => {
    const seen = new Map<string, string>();
    const dups: string[] = [];
    for (const r of KEYWORDS) {
      const norm = normalizeText(r.keyword);
      if (seen.has(norm)) {
        dups.push(`${seen.get(norm)} ~ ${r.keyword}`);
      } else {
        seen.set(norm, r.keyword);
      }
    }
    expect(dups, dups.join(", ")).toEqual([]);
  });

  it("uses only valid CategoryCode values", () => {
    for (const r of KEYWORDS) {
      expect(CODES.has(r.category), `bad code on ${r.keyword}: ${r.category}`).toBe(true);
    }
  });

  it("stores keywords in lowercase", () => {
    for (const r of KEYWORDS) {
      expect(r.keyword, r.keyword).toBe(r.keyword.toLowerCase());
    }
  });

  it("places 'ah to go' before plain 'ah' (specific-first)", () => {
    const idxToGo = KEYWORDS.findIndex((r) => r.keyword === "ah to go");
    const idxAh = KEYWORDS.findIndex((r) => r.keyword === "ah");
    expect(idxToGo).toBeGreaterThanOrEqual(0);
    expect(idxAh).toBeGreaterThan(idxToGo);
  });

  it("does not include bare 'total' (would clash with 'total hambake')", () => {
    expect(KEYWORDS.some((r) => r.keyword === "total")).toBe(false);
    expect(KEYWORDS.some((r) => r.keyword === "total hambake")).toBe(true);
  });
});
