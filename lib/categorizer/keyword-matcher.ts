import type { Transaction } from "@/lib/parsers/types";
import type { CategorizationResult, KeywordRule } from "./types";

/** Regex specials that must be escaped before being embedded in a pattern. */
const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/g;

function escapeRegex(s: string): string {
  return s.replace(REGEX_SPECIALS, "\\$&");
}

/**
 * Lowercase + strip combining diacritics, so "café" / "Cafe" / "univé" all
 * collapse to ASCII-ish lowercase ("cafe", "unive"). Required so a keyword
 * "unive" matches "Univé" in a description and vice-versa.
 */
const DIACRITICS_RE = /[̀-ͯ]/g;

/**
 * Lower-case + strip combining diacritics + map hyphens to spaces so e.g.
 * "NS-Zaltbommel" and "ns zaltbommel" collapse to the same form. The
 * resulting whitespace is run-collapsed to a single space.
 */
export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(DIACRITICS_RE, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Compose the haystack we match against: merchant + counterparty name +
 * description, all normalised and joined with spaces. The counterpartyName
 * is essential for SEPA-overschrijvingen (KPN, VGZ, ...) where the merchant
 * field is null and the brand only lives in the IBAN tegenpartij. The
 * description carries the rest (also covers iDEAL / Betaalverzoek, where
 * the merchant is null and the description holds the human label).
 */
export function buildHaystack(t: Transaction): string {
  return normalizeText(
    [t.merchant, t.counterpartyName, t.description]
      .filter((s): s is string => typeof s === "string" && s.length > 0)
      .join(" "),
  );
}

/** Build a cached word-boundary regex for one rule. */
function ruleRegex(rule: KeywordRule): RegExp {
  return new RegExp(`\\b${escapeRegex(normalizeText(rule.keyword))}\\b`);
}

/**
 * Try to assign one transaction to a category by linear scan over `rules`.
 * First matching rule wins. Returns `category: null` when nothing matches —
 * the caller (AI-fallback in 4c-2) decides what to do next.
 */
export function matchKeyword(
  transaction: Transaction,
  rules: readonly KeywordRule[],
): CategorizationResult {
  const haystack = buildHaystack(transaction);

  for (const rule of rules) {
    if (ruleRegex(rule).test(haystack)) {
      return {
        transaction,
        category: rule.category,
        source: "keyword",
        matchedKeyword: rule.keyword,
      };
    }
  }

  return { transaction, category: null, source: "keyword" };
}
