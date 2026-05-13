import type {
  AiCategorizationItem,
  AiCategorizationResponse,
  AiCategoryResult,
  AiProvider,
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

export const mockAiProvider: AiProvider = {
  async categorizeBatch(
    items: AiCategorizationItem[],
  ): Promise<AiCategorizationResponse[]> {
    return items.map((item) => ({
      transactionId: item.transactionId,
      category: classify(item),
    }));
  },
};
