import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { parseRabobankPdf } from "@/lib/parsers/rabobank";
import { categorizeTransactions } from "@/lib/categorizer";
import type { CategorizationResult } from "@/lib/categorizer";
import { calculateInflation } from "@/lib/inflation";
import type { InflationCalculation } from "@/lib/inflation";
import type { Transaction } from "@/lib/parsers/types";

const PDF_PATH = new URL(
  "../../test-data/rabobank-2025-04.pdf",
  import.meta.url,
);
const pdfBuffer = readFileSync(PDF_PATH);

describe("inflation (integration, test-data/rabobank-2025-04.pdf)", () => {
  let transactions: Transaction[];
  let categorized: CategorizationResult[];
  let inflation: InflationCalculation;

  beforeAll(async () => {
    transactions = await parseRabobankPdf(pdfBuffer);
    categorized = await categorizeTransactions(transactions);
    inflation = await calculateInflation(categorized);
  });

  it("produces a reasonable totalInflation between -5% and +15%", () => {
    expect(inflation.totalInflation).toBeGreaterThan(-5);
    expect(inflation.totalInflation).toBeLessThan(15);
  });

  it("uses at least four categories", () => {
    expect(inflation.categoriesUsed).toBeGreaterThanOrEqual(4);
  });

  it("reports an uncategorizedRatio consistent with mock AI (~20%)", () => {
    // After 4c-1 fixes + mock AI we land around 79.8% coverage =>
    // ~20% uncategorized. Allow a 5pp band so future tiny shifts in test data
    // don't flake the test.
    expect(inflation.uncategorizedRatio).toBeGreaterThan(0.15);
    expect(inflation.uncategorizedRatio).toBeLessThan(0.3);
  });

  it("breakdown length equals categoriesUsed", () => {
    expect(inflation.breakdown.length).toBe(inflation.categoriesUsed);
  });

  it("weights sum to ~1.0 (tolerance 1e-3)", () => {
    const sum = inflation.breakdown.reduce((s, b) => s + b.weight, 0);
    expect(sum).toBeCloseTo(1.0, 3);
  });

  it("sum of contributions equals totalInflation", () => {
    const sum = inflation.breakdown.reduce((s, b) => s + b.contribution, 0);
    expect(sum).toBeCloseTo(inflation.totalInflation, 6);
  });

  it("breakdown is sorted by contribution descending", () => {
    for (let i = 1; i < inflation.breakdown.length; i++) {
      expect(inflation.breakdown[i - 1].contribution).toBeGreaterThanOrEqual(
        inflation.breakdown[i].contribution,
      );
    }
  });

  it("monthsIncluded contains 2025-04 (the statement month)", () => {
    expect(inflation.monthsIncluded).toContain("2025-04");
  });

  it("does not surface a referenceInflation in v1", () => {
    expect(inflation.referenceInflation).toBeUndefined();
  });
});
