import { describe, expect, it } from "vitest";

import { splitUnknowns } from "@/lib/wizard/correct-filters";
import type { ProcessResult, ProcessTransaction } from "@/lib/wizard/types";

function tx(
  id: string,
  category: ProcessTransaction["category"],
  amount = 10,
): ProcessTransaction {
  return {
    id,
    date: "2025-01-15T00:00:00.000Z",
    amount,
    merchant: id,
    description: id,
    category,
    categorySource: category ? "keyword" : null,
  };
}

function result(transactions: ProcessTransaction[]): ProcessResult {
  return {
    bank: "rabobank",
    transactionCount: transactions.length,
    categorizedCount: transactions.filter((t) => t.category !== null).length,
    unknownCount: transactions.filter((t) => t.category === null).length,
    transactions,
  };
}

describe("splitUnknowns", () => {
  it("returns only category===null rows in allUnknowns", () => {
    const r = result([tx("a", "01"), tx("b", null), tx("c", null)]);
    const { allUnknowns } = splitUnknowns(r, new Set());
    expect(allUnknowns.map((t) => t.id)).toEqual(["b", "c"]);
  });

  it("partitions allUnknowns into active and excluded by the exclusion set", () => {
    const r = result([tx("a", null), tx("b", null), tx("c", null)]);
    const { allUnknowns, activeUnknowns, excludedUnknowns } = splitUnknowns(
      r,
      new Set(["b"]),
    );
    expect(allUnknowns.map((t) => t.id)).toEqual(["a", "b", "c"]);
    expect(activeUnknowns.map((t) => t.id)).toEqual(["a", "c"]);
    expect(excludedUnknowns.map((t) => t.id)).toEqual(["b"]);
  });

  it("ignores excluded ids that point to already-categorized transactions", () => {
    // Review can exclude any row, including categorized ones. Those must not
    // leak into the Correct screen's unknowns buckets.
    const r = result([tx("cat", "07"), tx("u", null)]);
    const out = splitUnknowns(r, new Set(["cat"]));
    expect(out.allUnknowns.map((t) => t.id)).toEqual(["u"]);
    expect(out.excludedUnknowns).toEqual([]);
    expect(out.activeUnknowns.map((t) => t.id)).toEqual(["u"]);
  });

  it("returns empty buckets when there are no unknowns", () => {
    const r = result([tx("a", "01"), tx("b", "02")]);
    const out = splitUnknowns(r, new Set());
    expect(out.allUnknowns).toEqual([]);
    expect(out.activeUnknowns).toEqual([]);
    expect(out.excludedUnknowns).toEqual([]);
  });

  it("returns an empty active bucket when every unknown is excluded", () => {
    const r = result([tx("a", null), tx("b", null)]);
    const out = splitUnknowns(r, new Set(["a", "b"]));
    expect(out.activeUnknowns).toEqual([]);
    expect(out.excludedUnknowns.map((t) => t.id)).toEqual(["a", "b"]);
  });
});
