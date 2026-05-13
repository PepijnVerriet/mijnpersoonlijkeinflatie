import { describe, expect, it } from "vitest";
import { mockAiProvider } from "@/lib/categorizer/ai/mock-provider";
import type { AiCategorizationItem } from "@/lib/categorizer/ai/types";

function item(partial: Partial<AiCategorizationItem>): AiCategorizationItem {
  return {
    transactionId: "0",
    merchant: null,
    counterpartyName: null,
    description: "",
    ...partial,
  };
}

describe("mockAiProvider.categorizeBatch", () => {
  it("returns 09 for 'biblioth' anywhere in the inputs", async () => {
    const [r] = await mockAiProvider.categorizeBatch([
      item({ description: "Biblioth.M.Brabant" }),
    ]);
    expect(r.category).toBe("09");
  });

  it("returns 09 for the full 'bibliotheek' substring", async () => {
    const [r] = await mockAiProvider.categorizeBatch([
      item({ counterpartyName: "Stichting Bibliotheek Midden-Brabant" }),
    ]);
    expect(r.category).toBe("09");
  });

  it("returns 'unknown' for paypal", async () => {
    const [r] = await mockAiProvider.categorizeBatch([
      item({ description: "PayPal Luxembourg" }),
    ]);
    expect(r.category).toBe("unknown");
  });

  it("returns 'unknown' for tikkie / betaalverzoek without further context", async () => {
    const [a, b] = await mockAiProvider.categorizeBatch([
      item({ description: "Tikkie van Jan" }),
      item({ description: "Rabo Betaalverzoek" }),
    ]);
    expect(a.category).toBe("unknown");
    expect(b.category).toBe("unknown");
  });

  it("defaults to 'unknown' when nothing matches", async () => {
    const [r] = await mockAiProvider.categorizeBatch([
      item({ description: "XYZ Random Shop" }),
    ]);
    expect(r.category).toBe("unknown");
  });

  it("preserves transactionId and input order", async () => {
    const out = await mockAiProvider.categorizeBatch([
      item({ transactionId: "a", description: "biblioth" }),
      item({ transactionId: "b", description: "paypal" }),
      item({ transactionId: "c", description: "anders" }),
    ]);
    expect(out.map((r) => r.transactionId)).toEqual(["a", "b", "c"]);
    expect(out.map((r) => r.category)).toEqual(["09", "unknown", "unknown"]);
  });
});
