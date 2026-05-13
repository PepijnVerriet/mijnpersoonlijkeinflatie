import { describe, expect, it, vi } from "vitest";
import {
  AI_MODEL_ID,
  AnthropicAiProvider,
  type AnthropicLike,
} from "@/lib/categorizer/ai/anthropic-provider";
import type { AiCategorizationItem } from "@/lib/categorizer/ai/types";

function items(n: number): AiCategorizationItem[] {
  return Array.from({ length: n }, (_, i) => ({
    transactionId: String(i),
    merchant: `M${i}`,
    counterpartyName: null,
    description: `desc-${i}`,
  }));
}

/** Build a fake Anthropic client whose `messages.create` is a vitest mock. */
function fakeClient(create: ReturnType<typeof vi.fn>): AnthropicLike {
  return { messages: { create: create as never } };
}

function textMessage(body: string) {
  return {
    id: "msg_1",
    type: "message" as const,
    role: "assistant" as const,
    model: AI_MODEL_ID,
    stop_reason: "end_turn" as const,
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
    content: [{ type: "text" as const, text: body, citations: null }],
  };
}

describe("AnthropicAiProvider", () => {
  it("returns [] for an empty batch (does not call the API)", async () => {
    const create = vi.fn();
    const p = new AnthropicAiProvider({ client: fakeClient(create) });
    expect(await p.categorizeBatch([])).toEqual([]);
    expect(create).not.toHaveBeenCalled();
  });

  it("calls the configured model and parses a JSON-array body", async () => {
    const create = vi.fn().mockResolvedValue(
      textMessage(
        '[{"transactionId":"0","category":"07"},' +
          '{"transactionId":"1","category":"unknown"}]',
      ),
    );
    const p = new AnthropicAiProvider({ client: fakeClient(create) });
    const out = await p.categorizeBatch(items(2));

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].model).toBe(AI_MODEL_ID);
    expect(out).toEqual([
      { transactionId: "0", category: "07" },
      { transactionId: "1", category: "unknown" },
    ]);
  });

  it("tolerates surrounding prose around the JSON array", async () => {
    const create = vi.fn().mockResolvedValue(
      textMessage(
        'Hier is het antwoord:\n[{"transactionId":"0","category":"01"}]\nGroet, Claude.',
      ),
    );
    const p = new AnthropicAiProvider({ client: fakeClient(create) });
    const out = await p.categorizeBatch(items(1));
    expect(out[0].category).toBe("01");
  });

  it("returns 'unknown' for every item when the response is not valid JSON", async () => {
    const create = vi.fn().mockResolvedValue(textMessage("dit is geen json"));
    const p = new AnthropicAiProvider({ client: fakeClient(create) });
    const out = await p.categorizeBatch(items(3));
    expect(out.map((r) => r.category)).toEqual(["unknown", "unknown", "unknown"]);
  });

  it("falls back to 'unknown' for unknown categories in the response", async () => {
    const create = vi.fn().mockResolvedValue(
      textMessage('[{"transactionId":"0","category":"99"}]'),
    );
    const p = new AnthropicAiProvider({ client: fakeClient(create) });
    const out = await p.categorizeBatch(items(1));
    expect(out[0].category).toBe("unknown");
  });

  it("retries once on a 429 and succeeds", async () => {
    const err: { status: number; message: string } = { status: 429, message: "rate limit" };
    const create = vi
      .fn()
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce(
        textMessage('[{"transactionId":"0","category":"07"}]'),
      );
    const p = new AnthropicAiProvider({
      client: fakeClient(create),
      retryDelayMs: 0,
    });
    const out = await p.categorizeBatch(items(1));
    expect(create).toHaveBeenCalledTimes(2);
    expect(out[0].category).toBe("07");
  });

  it("retries once on a 503 and returns 'unknown' if the retry also fails", async () => {
    const create = vi
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockRejectedValueOnce({ status: 503 });
    const p = new AnthropicAiProvider({
      client: fakeClient(create),
      retryDelayMs: 0,
    });
    const out = await p.categorizeBatch(items(2));
    expect(create).toHaveBeenCalledTimes(2);
    expect(out.map((r) => r.category)).toEqual(["unknown", "unknown"]);
  });

  it("does NOT retry on a non-retryable error (e.g. 401)", async () => {
    const create = vi.fn().mockRejectedValue({ status: 401, message: "auth" });
    const p = new AnthropicAiProvider({
      client: fakeClient(create),
      retryDelayMs: 0,
    });
    const out = await p.categorizeBatch(items(1));
    expect(create).toHaveBeenCalledTimes(1);
    expect(out[0].category).toBe("unknown");
  });

  it("throws when constructed without a client and without ANTHROPIC_API_KEY", () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      expect(() => new AnthropicAiProvider()).toThrow(/ANTHROPIC_API_KEY/);
    } finally {
      if (original !== undefined) process.env.ANTHROPIC_API_KEY = original;
    }
  });
});
