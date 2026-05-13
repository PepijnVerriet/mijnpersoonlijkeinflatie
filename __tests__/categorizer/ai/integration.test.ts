import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { parseRabobankPdf } from "@/lib/parsers/rabobank";
import { categorizeTransactions } from "@/lib/categorizer";
import type { CategorizationResult } from "@/lib/categorizer";
import { InMemoryCache } from "@/lib/categorizer/ai/cache";
import { mockAiProvider } from "@/lib/categorizer/ai/mock-provider";
import type { Transaction } from "@/lib/parsers/types";

const PDF_PATH = new URL(
  "../../../test-data/rabobank-2025-04.pdf",
  import.meta.url,
);
const pdfBuffer = readFileSync(PDF_PATH);

function describeTx(t: Transaction): string {
  return (t.merchant ?? t.counterpartyName ?? t.description ?? "(empty)").trim();
}

describe("categorizer + mock AI (integration, test-data/rabobank-2025-04.pdf)", () => {
  let transactions: Transaction[];
  let results: CategorizationResult[];

  beforeAll(async () => {
    transactions = await parseRabobankPdf(pdfBuffer);
    results = await categorizeTransactions(transactions, {
      aiProvider: mockAiProvider,
      cache: new InMemoryCache(),
    });
  });

  it("reaches at least 78% combined coverage (keyword + mock AI)", () => {
    const matched = results.filter((r) => r.category !== null).length;
    const coverage = matched / results.length;

    // Informational — always print.
    // eslint-disable-next-line no-console
    console.log(
      `\n[ai-integration] coverage: ${(coverage * 100).toFixed(1)}%  ` +
        `(${matched}/${results.length})\n`,
    );

    // 90% target reserved for the live Anthropic test under __tests__/categorizer/ai/live/.
    expect(coverage).toBeGreaterThanOrEqual(0.78);
  });

  it("marks all six Bouman transactions as 'ai' source with null category (unknown)", () => {
    const boumanResults = results.filter((r) => /bouman/i.test(describeTx(r.transaction)));
    expect(boumanResults.length).toBeGreaterThanOrEqual(6);
    for (const r of boumanResults) {
      expect(r.category, `Bouman tx should be null/unknown: ${describeTx(r.transaction)}`).toBeNull();
      expect(r.source).toBe("ai");
    }
  });

  it("classifies Biblioth.M.Brabant as category 09 via AI", () => {
    const biblio = results.find((r) => /biblioth/i.test(describeTx(r.transaction)));
    expect(biblio, "Biblioth transaction should exist in test data").toBeDefined();
    expect(biblio!.category).toBe("09");
    expect(biblio!.source).toBe("ai");
  });

  it("never assigns 'ai' source to a transaction that already matched a keyword", () => {
    for (const r of results) {
      if (r.matchedKeyword) {
        expect(r.source).toBe("keyword");
      }
    }
  });
});
