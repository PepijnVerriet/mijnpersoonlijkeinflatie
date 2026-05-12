// @ts-nocheck -- test runner (Jest/Vitest) not configured yet.
import { computePersonalInflation, computeWeights } from "@/lib/inflation";

describe("computeWeights", () => {
  it.todo("derives per-COICOP spending shares that sum to ~1");
  it.todo("ignores incoming (positive) transactions");
});

describe("computePersonalInflation", () => {
  it.todo("weights CBS CPI changes by personal spending shares");
  it.todo("reports per-category contributions");
  it.todo("includes the CBS headline rate for comparison");
});
