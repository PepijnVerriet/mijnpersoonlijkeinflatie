import { AnthropicAiProvider } from "./anthropic-provider";
import { mockAiProvider } from "./mock-provider";
import type { AiProvider } from "./types";

/**
 * Resolve which AI provider to use. Reads `AI_PROVIDER` from the server-side
 * environment (CLAUDE.md principle 17):
 *   - "anthropic" → live Claude Haiku
 *   - "mock" (default, or anything else) → deterministic stub for tests/dev
 *
 * MockProvider blijft singleton conform bestaande implementatie.
 * AnthropicAiProvider is stateful per instance vanwege constructor-injectie
 * van SDK client (en houdt usage-stats bij), dus we maken er hier elke keer
 * een nieuwe.
 */
export function getAiProvider(): AiProvider {
  const providerName = process.env.AI_PROVIDER ?? "mock";
  if (providerName === "anthropic") {
    return new AnthropicAiProvider();
  }
  return mockAiProvider;
}
