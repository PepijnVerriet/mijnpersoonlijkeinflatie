import Anthropic from "@anthropic-ai/sdk";
import {
  USER_FACING_CATEGORIES,
  USER_FACING_CATEGORY_CODES,
} from "@/lib/cbs/categories";
import type { CategoryCode } from "@/lib/cbs/types";
import type {
  AiCategorizationItem,
  AiCategorizationResponse,
  AiCategoryResult,
  AiProvider,
  AiSuggestionResponse,
} from "./types";

/**
 * Claude model used for the AI fallback. Pinned to the dated alias so a
 * future Haiku release does not silently change behaviour.
 */
export const AI_MODEL_ID = "claude-haiku-4-5-20251001";

/** Wait between the first failed call and the single retry (CLAUDE.md). */
export const RETRY_DELAY_MS = 2_000;

/**
 * Categories the model is allowed to return (plus "unknown"). Derived from
 * USER_FACING_CATEGORY_CODES so system-only codes (e.g. 14 Belastingen) are
 * automatically excluded.
 */
const VALID_CATEGORIES = new Set<string>(USER_FACING_CATEGORY_CODES);

/**
 * Prompt-specific hints per category. Kept here (not in categories.ts) because
 * they are tuned for the AI prompt and may change independently of canonical
 * category metadata.
 */
const CATEGORY_HINTS: Record<string, string> = {
  "01": "supermarkten, bakkers, slagers",
  "02": "slijterijen, tabakszaken",
  "03": "kleding, schoenen",
  "04": "huur, hypotheek, gas/licht, water",
  "05": "meubels, huishoudelijke apparaten, schoonmaak, gereedschap",
  "06": "apotheek, tandarts, ziekenhuis, fysiotherapie",
  "07": "benzine, OV, auto-onderhoud, parkeren, taxi/Uber",
  "08": "internet, mobiele abonnementen, software-abonnementen (Adobe, MS365), post",
  "09": "bioscoop, streaming (Netflix/Spotify), sport, hobby, games, AV-elektronica",
  "10": "collegegeld, online cursussen (Coursera/Udemy/MasterClass), schoolboeken",
  "11": "restaurants, fastfood, kantines, hotels, vakantieverblijf",
  "12": "verzekeringen (zorg, auto, woon, leven, uitvaart), bankkosten",
  "13": "kapper, schoonheid, persoonlijke verzorging, juridisch advies",
};

function buildCategoryList(): string {
  return USER_FACING_CATEGORIES
    .map((c) => `${c.code} = ${c.name} (${CATEGORY_HINTS[c.code]})`)
    .join("\n");
}

const SYSTEM_PROMPT = `Je categoriseert Nederlandse bankuitgaven naar COICOP-hoofdcategorieën (01-13).

CATEGORIEËN:
${buildCategoryList()}

REGELS:
- Antwoord per transactie met EEN code (01-13) OF "unknown"
- "unknown" alleen als je echt geen redelijke gok kunt maken
- Tikkies en betaalverzoeken: gebruik de beschrijving NA de naam ("Bouman: Cafetaria Marktzicht" → 11)
- Giften, terugbetalingen tussen vrienden, salaris, of interne overboekingen: "unknown" (worden niet meegerekend)
- Format: JSON-array met objecten {transactionId, category}`;

/**
 * Stricter prompt for `suggestBatch`: forces a concrete category for *every*
 * item. The UI shows these as pre-selected dropdown values that the user can
 * still override; "unknown" would just punt the work back to them.
 */
const SUGGESTION_SYSTEM_PROMPT = `Je categoriseert Nederlandse bankuitgaven naar COICOP-hoofdcategorieën (01-13).

CATEGORIEËN:
${buildCategoryList()}

REGELS:
- Geef ALTIJD een categorie 01-13, ook bij twijfel. Dit is een suggestie die de gebruiker kan corrigeren.
- Kies de meest waarschijnlijke categorie op basis van merchant en omschrijving.
- Bij volstrekt geen aanknopingspunten: kies 13 (diverse goederen en diensten).
- Tikkies en betaalverzoeken: gebruik de beschrijving NA de naam.
- Format: JSON-array met objecten {transactionId, category}`;

/** Safe fallback when even the strict prompt cannot yield a category. */
const SUGGESTION_FALLBACK: CategoryCode = "13";

/** Minimal slice of the SDK we actually use — easy to fake in tests. */
export interface AnthropicLike {
  messages: {
    create(
      params: Anthropic.MessageCreateParamsNonStreaming,
    ): Promise<Anthropic.Message>;
  };
}

export interface AnthropicProviderOptions {
  /** Inject a client for tests. Defaults to a real SDK instance. */
  client?: AnthropicLike;
  /** Override the API key (otherwise read from env). */
  apiKey?: string;
  /** Override the retry wait (used by tests to skip the 2s sleep). */
  retryDelayMs?: number;
}

function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return status === 429 || (typeof status === "number" && status >= 500);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function allUnknown(items: AiCategorizationItem[]): AiCategorizationResponse[] {
  return items.map((it) => ({
    transactionId: it.transactionId,
    category: "unknown" as const,
  }));
}

/** Find the first `[...]` JSON-array substring in a message body. */
function extractJsonArray(text: string): string | null {
  const start = text.indexOf("[");
  if (start < 0) return null;
  // Bracket-counting to handle nested arrays safely.
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "[") depth += 1;
    else if (text[i] === "]") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

interface ParseOutcome {
  responses: AiCategorizationResponse[];
  parseFailed: boolean;
}

function parseResponseBody(
  text: string,
  items: AiCategorizationItem[],
): ParseOutcome {
  const json = extractJsonArray(text);
  if (!json) {
    // eslint-disable-next-line no-console
    console.error("[anthropic-provider] no JSON array in response, returning unknown");
    return { responses: allUnknown(items), parseFailed: true };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[anthropic-provider] JSON.parse failed, returning unknown", err);
    return { responses: allUnknown(items), parseFailed: true };
  }
  if (!Array.isArray(parsed)) {
    // eslint-disable-next-line no-console
    console.error("[anthropic-provider] response is not an array, returning unknown");
    return { responses: allUnknown(items), parseFailed: true };
  }

  const byId = new Map<string, AiCategoryResult>();
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;
    const id = (entry as { transactionId?: unknown }).transactionId;
    const cat = (entry as { category?: unknown }).category;
    if (typeof id !== "string" || typeof cat !== "string") continue;
    if (cat === "unknown" || VALID_CATEGORIES.has(cat)) {
      byId.set(id, cat as AiCategoryResult);
    }
  }

  return {
    responses: items.map((it) => ({
      transactionId: it.transactionId,
      category: byId.get(it.transactionId) ?? "unknown",
    })),
    parseFailed: false,
  };
}

function pickText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/** Telemetry surface — useful for the live test and for cost estimates. */
export interface AnthropicProviderStats {
  batches: number;
  retries: number;
  parseErrors: number;
  inputTokens: number;
  outputTokens: number;
}

export class AnthropicAiProvider implements AiProvider {
  private readonly client: AnthropicLike;
  private readonly retryDelayMs: number;

  /** Mutated in place as calls are made; read after running for diagnostics. */
  readonly stats: AnthropicProviderStats = {
    batches: 0,
    retries: 0,
    parseErrors: 0,
    inputTokens: 0,
    outputTokens: 0,
  };

  constructor(opts: AnthropicProviderOptions = {}) {
    if (opts.client) {
      this.client = opts.client;
    } else {
      const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error(
          "ANTHROPIC_API_KEY is not set; cannot create AnthropicAiProvider " +
            "without an injected client.",
        );
      }
      this.client = new Anthropic({ apiKey });
    }
    this.retryDelayMs = opts.retryDelayMs ?? RETRY_DELAY_MS;
  }

  async categorizeBatch(
    items: AiCategorizationItem[],
  ): Promise<AiCategorizationResponse[]> {
    if (items.length === 0) return [];

    const userPrompt =
      "Categoriseer onderstaande transacties. Antwoord met een JSON-array " +
      "van objecten {transactionId, category}. Geef alleen het JSON-array terug.\n\n" +
      "INPUT:\n" +
      JSON.stringify(
        items.map((it) => ({
          transactionId: it.transactionId,
          merchant: it.merchant,
          counterpartyName: it.counterpartyName,
          description: it.description,
        })),
        null,
        2,
      );

    const call = () =>
      this.client.messages.create({
        model: AI_MODEL_ID,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

    this.stats.batches += 1;

    let message: Anthropic.Message;
    try {
      message = await call();
    } catch (err) {
      if (isRetryable(err)) {
        // eslint-disable-next-line no-console
        console.warn("[anthropic-provider] retryable error, retrying once", err);
        this.stats.retries += 1;
        await sleep(this.retryDelayMs);
        try {
          message = await call();
        } catch (err2) {
          // eslint-disable-next-line no-console
          console.error("[anthropic-provider] retry failed, returning unknown", err2);
          return allUnknown(items);
        }
      } else {
        // eslint-disable-next-line no-console
        console.error("[anthropic-provider] non-retryable error, returning unknown", err);
        return allUnknown(items);
      }
    }

    if (message.usage) {
      this.stats.inputTokens += message.usage.input_tokens ?? 0;
      this.stats.outputTokens += message.usage.output_tokens ?? 0;
    }

    const { responses, parseFailed } = parseResponseBody(pickText(message), items);
    if (parseFailed) this.stats.parseErrors += 1;
    return responses;
  }

  /**
   * Best-guess pass for items the standard flow returned "unknown" for.
   * Uses {@link SUGGESTION_SYSTEM_PROMPT} so the model is forced to commit
   * to a category. Any leftover "unknown" or unparseable result falls back
   * to category 13 (Diverse goederen en diensten).
   */
  async suggestBatch(items: AiCategorizationItem[]): Promise<AiSuggestionResponse[]> {
    if (items.length === 0) return [];

    const userPrompt =
      "Geef voor onderstaande transacties een best-guess COICOP-categorie. " +
      "Antwoord met een JSON-array van {transactionId, category}. " +
      "Geef alleen het JSON-array terug.\n\nINPUT:\n" +
      JSON.stringify(
        items.map((it) => ({
          transactionId: it.transactionId,
          merchant: it.merchant,
          counterpartyName: it.counterpartyName,
          description: it.description,
        })),
        null,
        2,
      );

    const call = () =>
      this.client.messages.create({
        model: AI_MODEL_ID,
        max_tokens: 1024,
        system: SUGGESTION_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

    this.stats.batches += 1;

    let message: Anthropic.Message;
    try {
      message = await call();
    } catch (err) {
      if (isRetryable(err)) {
        // eslint-disable-next-line no-console
        console.warn("[anthropic-provider:suggest] retryable error, retrying once", err);
        this.stats.retries += 1;
        await sleep(this.retryDelayMs);
        try {
          message = await call();
        } catch (err2) {
          // eslint-disable-next-line no-console
          console.error("[anthropic-provider:suggest] retry failed, returning fallback", err2);
          return items.map((it) => ({
            transactionId: it.transactionId,
            category: SUGGESTION_FALLBACK,
          }));
        }
      } else {
        // eslint-disable-next-line no-console
        console.error("[anthropic-provider:suggest] non-retryable error, returning fallback", err);
        return items.map((it) => ({
          transactionId: it.transactionId,
          category: SUGGESTION_FALLBACK,
        }));
      }
    }

    if (message.usage) {
      this.stats.inputTokens += message.usage.input_tokens ?? 0;
      this.stats.outputTokens += message.usage.output_tokens ?? 0;
    }

    const { responses, parseFailed } = parseResponseBody(pickText(message), items);
    if (parseFailed) this.stats.parseErrors += 1;

    // Replace any leftover "unknown" with the safe fallback; the contract of
    // suggestBatch is that every item gets a concrete CategoryCode.
    return responses.map((r) => ({
      transactionId: r.transactionId,
      category: r.category === "unknown" ? SUGGESTION_FALLBACK : r.category,
    }));
  }
}
