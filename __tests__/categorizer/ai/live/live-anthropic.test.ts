/**
 * LIVE AI TEST — calls the real Anthropic API. Skipped by default.
 *
 * Enable with:
 *   ENABLE_LIVE_AI_TESTS=true npx vitest run __tests__/categorizer/ai/live
 *
 * Reads ANTHROPIC_API_KEY from .env.local (loaded by __tests__/setup-env.ts).
 * Uses an in-memory cache only — the on-disk ai-cache.json is NEVER touched.
 */
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { parseRabobankPdf } from "@/lib/parsers/rabobank";
import { categorizeTransactions } from "@/lib/categorizer";
import type { CategorizationResult } from "@/lib/categorizer";
import { InMemoryCache } from "@/lib/categorizer/ai/cache";
import { AnthropicAiProvider } from "@/lib/categorizer/ai/anthropic-provider";
import type { CategoryCode } from "@/lib/cbs/types";
import { getCategory } from "@/lib/cbs/categories";

const ENABLE_LIVE = process.env.ENABLE_LIVE_AI_TESTS === "true";

const PDF_PATH = new URL(
  "../../../../test-data/rabobank-2025-04.pdf",
  import.meta.url,
);

// Haiku 4.5 published pricing (USD per 1M tokens). Adjust if Anthropic changes them.
const PRICE_INPUT_PER_MTOK = 0.8;
const PRICE_OUTPUT_PER_MTOK = 4.0;

(ENABLE_LIVE ? describe : describe.skip)(
  "live Anthropic categorizer (real API, paid)",
  () => {
    let results: CategorizationResult[];
    let provider: AnthropicAiProvider;

    beforeAll(async () => {
      provider = new AnthropicAiProvider();
      const pdf = readFileSync(PDF_PATH);
      const txs = await parseRabobankPdf(pdf);
      results = await categorizeTransactions(txs, {
        aiProvider: provider,
        cache: new InMemoryCache(), // no disk writes
      });
    }, /* timeout */ 180_000);

    it("prints a diagnostic report", () => {
      const total = results.length;
      const aiAttributed = results.filter((r) => r.source === "ai");
      const aiKnown = aiAttributed.filter((r) => r.category !== null);
      const aiUnknown = aiAttributed.filter((r) => r.category === null);
      const matched = results.filter((r) => r.category !== null).length;
      const coverage = matched / total;

      const histogram = new Map<CategoryCode, number>();
      for (const r of results) {
        if (r.category !== null) {
          histogram.set(r.category, (histogram.get(r.category) ?? 0) + 1);
        }
      }
      const top5 = [...histogram.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([code, count]) => {
          const name = getCategory(code).shortName;
          return `${code} ${name} (${count})`;
        });

      // Per-AI category list for sanity-check.
      const aiByCategory = new Map<CategoryCode | "unknown", Array<string>>();
      for (const r of aiAttributed) {
        const key = (r.category ?? "unknown") as CategoryCode | "unknown";
        const label = (
          r.transaction.merchant ??
          r.transaction.counterpartyName ??
          r.transaction.description ??
          "(empty)"
        )
          .trim()
          .slice(0, 60);
        const list = aiByCategory.get(key) ?? [];
        list.push(label);
        aiByCategory.set(key, list);
      }

      const stats = provider.stats;
      const inUsd = (stats.inputTokens / 1_000_000) * PRICE_INPUT_PER_MTOK;
      const outUsd = (stats.outputTokens / 1_000_000) * PRICE_OUTPUT_PER_MTOK;
      const totalUsd = inUsd + outUsd;

      const lines: string[] = [];
      lines.push("");
      lines.push("════════════════ LIVE-AI DIAGNOSTIC ════════════════");
      lines.push(`Transacties totaal:           ${total}`);
      lines.push(
        `Gecategoriseerd (non-null):   ${matched}  (${(coverage * 100).toFixed(1)}% coverage)`,
      );
      lines.push(`Door AI gepoogd (source=ai):  ${aiAttributed.length}`);
      lines.push(`  - AI gaf een categorie:     ${aiKnown.length}`);
      lines.push(`  - AI bleef 'unknown':       ${aiUnknown.length}`);
      lines.push("");
      lines.push("Top-5 categorieën (na keyword + AI):");
      for (const line of top5) lines.push(`  ${line}`);
      lines.push("");
      lines.push("AI-toewijzingen per categorie:");
      const sortedAi = [...aiByCategory.entries()].sort((a, b) => {
        if (a[0] === "unknown") return 1;
        if (b[0] === "unknown") return -1;
        return String(a[0]).localeCompare(String(b[0]));
      });
      for (const [cat, labels] of sortedAi) {
        const name = cat === "unknown" ? "unknown" : `${cat} ${getCategory(cat).shortName}`;
        lines.push(`  [${name}] (${labels.length}):`);
        for (const lbl of labels) lines.push(`    - ${lbl}`);
      }
      lines.push("");
      lines.push("API-call telemetrie:");
      lines.push(`  Batches:        ${stats.batches}`);
      lines.push(`  Retries:        ${stats.retries}`);
      lines.push(`  Parse-errors:   ${stats.parseErrors}`);
      lines.push(`  Input tokens:   ${stats.inputTokens.toLocaleString("en-US")}`);
      lines.push(`  Output tokens:  ${stats.outputTokens.toLocaleString("en-US")}`);
      lines.push(
        `  Geschatte kosten: $${totalUsd.toFixed(4)}  (in $${inUsd.toFixed(4)} + out $${outUsd.toFixed(4)})`,
      );
      lines.push("════════════════════════════════════════════════════");

      // eslint-disable-next-line no-console
      console.log(lines.join("\n"));

      // Soft assertions — never fail this informational test on coverage,
      // but ensure no transactions were silently lost.
      expect(results.length).toBe(total);
    });
  },
);
