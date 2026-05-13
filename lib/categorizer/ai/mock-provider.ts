import type { CategoryCode } from "@/lib/cbs/types";
import type {
  AiCategorizationItem,
  AiCategorizationResponse,
  AiCategoryResult,
  AiProvider,
  AiSuggestionResponse,
} from "./types";

/**
 * Deterministic stand-in for the real Anthropic provider, so tests can
 * exercise the orchestrator and cache without API calls (or API keys).
 * Heuristieken zijn bewust beperkt — voor échte fall-back coverage gebruikt
 * de app de Anthropic-provider.
 */
function classify(item: AiCategorizationItem): AiCategoryResult {
  const haystack = [item.merchant, item.counterpartyName, item.description]
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .join(" ")
    .toLowerCase();

  if (haystack.includes("biblioth")) return "09";
  if (haystack.includes("paypal")) return "unknown";
  if (haystack.includes("tikkie") || haystack.includes("betaalverzoek")) {
    return "unknown";
  }
  return "unknown";
}

/** Fallback when the mock cannot produce a confident category. */
const SUGGESTION_FALLBACK: CategoryCode = "12";

export const mockAiProvider: AiProvider = {
  async categorizeBatch(
    items: AiCategorizationItem[],
  ): Promise<AiCategorizationResponse[]> {
    return items.map((item) => ({
      transactionId: item.transactionId,
      category: classify(item),
    }));
  },

  async suggestBatch(items: AiCategorizationItem[]): Promise<AiSuggestionResponse[]> {
    // The mock has no real reasoning power; whatever the standard pass returns,
    // we replace `"unknown"` with the safe fallback so the UI always shows a
    // concrete default the user can adjust.
    return items.map((item) => {
      const verdict = classify(item);
      return {
        transactionId: item.transactionId,
        category: verdict === "unknown" ? SUGGESTION_FALLBACK : verdict,
      };
    });
  },
};
