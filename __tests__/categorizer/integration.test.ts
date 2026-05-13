import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { parseRabobankPdf } from "@/lib/parsers/rabobank";
import { categorizeTransactions } from "@/lib/categorizer";
import type { CategorizationResult } from "@/lib/categorizer";
import type { Transaction } from "@/lib/parsers/types";
import type { CategoryCode } from "@/lib/cbs/types";

const PDF_PATH = new URL(
  "../../test-data/rabobank-2025-04.pdf",
  import.meta.url,
);
const pdfBuffer = readFileSync(PDF_PATH);

/** Aggregate transactions by category, dropping nulls. */
function categoryHistogram(results: CategorizationResult[]): Map<CategoryCode, number> {
  const h = new Map<CategoryCode, number>();
  for (const r of results) {
    if (r.category) h.set(r.category, (h.get(r.category) ?? 0) + 1);
  }
  return h;
}

/** Top-N categories by count. */
function topCategories(h: Map<CategoryCode, number>, n: number): CategoryCode[] {
  return [...h.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([code]) => code);
}

/** Group unmatched transactions by their normalized signal, keep counts. */
function topUnmatched(results: CategorizationResult[], n: number): Array<{ key: string; count: number; example: Transaction }> {
  const map = new Map<string, { count: number; example: Transaction }>();
  for (const r of results) {
    if (r.category !== null) continue;
    const t = r.transaction;
    const key = (t.merchant ?? t.counterpartyName ?? t.description ?? "(empty)").trim().slice(0, 80);
    const entry = map.get(key);
    if (entry) entry.count += 1;
    else map.set(key, { count: 1, example: t });
  }
  return [...map.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, n)
    .map(([key, v]) => ({ key, count: v.count, example: v.example }));
}

describe("keyword categorizer (integration, test-data/rabobank-2025-04.pdf)", () => {
  let transactions: Transaction[];
  let results: CategorizationResult[];

  beforeAll(async () => {
    transactions = await parseRabobankPdf(pdfBuffer);
    results = categorizeTransactions(transactions);
  });

  it("returns one result per transaction, in order", () => {
    expect(results.length).toBe(transactions.length);
    for (let i = 0; i < results.length; i++) {
      expect(results[i].transaction).toBe(transactions[i]);
    }
  });

  it("classifies at least 70% of transactions (keyword coverage)", () => {
    const matched = results.filter((r) => r.category !== null).length;
    const coverage = matched / results.length;

    // Always print so we know where we stand, even when the assertion passes.
    // eslint-disable-next-line no-console
    console.log(
      `\n[categorizer] coverage: ${(coverage * 100).toFixed(1)}%  ` +
        `(${matched}/${results.length})\n`,
    );

    if (coverage < 0.7) {
      const top = topUnmatched(results, 10);
      // eslint-disable-next-line no-console
      console.log(
        "[categorizer] top-10 unmatched (signal | count):\n" +
          top.map((u, i) => `  ${i + 1}. [${u.count}x] ${u.key}`).join("\n") +
          "\n",
      );
    }

    expect(coverage).toBeGreaterThanOrEqual(0.7);
  });

  it("has at least two of {01, 07, 11} in the top-3 categories", () => {
    const h = categoryHistogram(results);
    const top3 = new Set<string>(topCategories(h, 3));
    const wanted: CategoryCode[] = ["01", "07", "11"];
    const hits = wanted.filter((c) => top3.has(c)).length;

    // eslint-disable-next-line no-console
    console.log(
      "[categorizer] top-3 categories: " +
        topCategories(h, 3)
          .map((c) => `${c}=${h.get(c) ?? 0}`)
          .join(", "),
    );

    expect(hits).toBeGreaterThanOrEqual(2);
  });

  it("logs the top-5 unmatched transactions for review (informational)", () => {
    const top = topUnmatched(results, 5);
    // eslint-disable-next-line no-console
    console.log(
      "\n[categorizer] top-5 unmatched signals:\n" +
        (top.length === 0
          ? "  (none — 100% keyword coverage)"
          : top.map((u, i) => `  ${i + 1}. [${u.count}x] ${u.key}`).join("\n")) +
        "\n",
    );
    expect(top.length).toBeGreaterThanOrEqual(0); // never fails; this is a logger
  });
});
