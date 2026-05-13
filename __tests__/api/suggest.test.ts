import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/suggest/route";

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/suggest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/suggest", () => {
  it("returns suggestions for every input transaction", async () => {
    delete process.env.AI_PROVIDER; // force mock
    const res = await POST(
      buildRequest({
        transactions: [
          { id: "a", merchant: "Bouman", description: "Bouman" },
          { id: "b", merchant: null, description: "PayPal Luxembourg" },
          { id: "c", merchant: null, description: "Bibliotheek Tilburg" },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      suggestions: Array<{ id: string; suggestedCategory: string }>;
    };

    expect(body.suggestions).toHaveLength(3);
    const byId = new Map(body.suggestions.map((s) => [s.id, s.suggestedCategory]));
    for (const id of ["a", "b", "c"]) {
      const cat = byId.get(id);
      expect(cat).toBeDefined();
      expect(cat).not.toBe("unknown");
    }
    // Mock returns 09 for the bibliotheek heuristic.
    expect(byId.get("c")).toBe("09");
  });

  it("returns 200 with an empty array when no transactions are sent", async () => {
    const res = await POST(buildRequest({ transactions: [] }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { suggestions: unknown[] };
    expect(body.suggestions).toEqual([]);
  });

  it("returns 400 on an invalid body shape", async () => {
    const res = await POST(buildRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when an item is missing id or description", async () => {
    const res = await POST(
      buildRequest({ transactions: [{ id: "a" }] }),
    );
    expect(res.status).toBe(400);
  });
});
