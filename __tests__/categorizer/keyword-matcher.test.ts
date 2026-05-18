import { describe, expect, it } from "vitest";
import { matchKeyword, normalizeText, buildHaystack } from "@/lib/categorizer/keyword-matcher";
import { KEYWORDS } from "@/lib/categorizer/keywords";
import type { Transaction } from "@/lib/parsers/types";

function tx(partial: Partial<Transaction>): Transaction {
  return {
    date: new Date("2025-04-01"),
    amount: 0,
    type: "debit",
    code: "bc",
    counterpartyIban: null,
    counterpartyName: null,
    description: "",
    merchant: null,
    location: null,
    rawText: "",
    ...partial,
  };
}

describe("normalizeText", () => {
  it("lower-cases", () => {
    expect(normalizeText("Albert Heijn")).toBe("albert heijn");
  });

  it("strips combining diacritics", () => {
    expect(normalizeText("Univé")).toBe("unive");
    expect(normalizeText("café")).toBe("cafe");
  });
});

describe("buildHaystack", () => {
  it("joins merchant, counterpartyName and description", () => {
    const t = tx({
      merchant: "Jumbo",
      counterpartyName: "Stichting Jumbo",
      description: "Jumbo 199730 TILBURG",
    });
    expect(buildHaystack(t)).toBe("jumbo stichting jumbo jumbo 199730 tilburg");
  });

  it("skips null and empty fields", () => {
    const t = tx({ merchant: null, counterpartyName: "KPN B.V.", description: "" });
    expect(buildHaystack(t)).toBe("kpn b.v.");
  });
});

describe("matchKeyword — happy paths from the spec", () => {
  it.each([
    ["Jumbo 199730 TILBURG", "01", "jumbo"],
    ["BCK*Shell Best", "07", "shell"],
    ["NETFLIX INTERNATIONAL B.V.", "09", "netflix"],
    ["TILBURG UNIVERSITY", "10", "tilburg university"],
    ["KPN B.V.", "08", "kpn"],
    ["VGZ Zorgverzekeraar N.V.", "12", "vgz"],
  ])("classifies %j as category %s via keyword %j", (desc, category, kw) => {
    const result = matchKeyword(tx({ description: desc }), KEYWORDS);
    expect(result.category).toBe(category);
    expect(result.matchedKeyword).toBe(kw);
    expect(result.source).toBe("keyword");
  });
});

describe("matchKeyword — fall-through cases", () => {
  it("returns null for an unknown merchant", () => {
    const r = matchKeyword(tx({ description: "XYZ Random Shop" }), KEYWORDS);
    expect(r.category).toBeNull();
    expect(r.matchedKeyword).toBeUndefined();
    expect(r.source).toBe("keyword");
  });

  it("returns null for an empty description", () => {
    const r = matchKeyword(tx({ description: "" }), KEYWORDS);
    expect(r.category).toBeNull();
  });

  it("returns null for a Betaalverzoek with no keyword in description", () => {
    const r = matchKeyword(
      tx({ code: "bv", merchant: null, counterpartyName: "M. Jansen", description: "Sloffen" }),
      KEYWORDS,
    );
    expect(r.category).toBeNull();
  });
});

describe("matchKeyword — uses every available field", () => {
  it("matches via counterpartyName when description is empty", () => {
    const r = matchKeyword(tx({ counterpartyName: "KPN B.V.", description: "" }), KEYWORDS);
    expect(r.category).toBe("08");
  });

  it("matches via merchant when description has no signal", () => {
    const r = matchKeyword(tx({ merchant: "Jumbo", description: "199730" }), KEYWORDS);
    expect(r.category).toBe("01");
  });

  it("matches a Betaalverzoek whose description names a known venue", () => {
    const r = matchKeyword(
      tx({ code: "bv", merchant: null, counterpartyName: null, description: "Stadscafe De Republiek" }),
      KEYWORDS,
    );
    expect(r.category).toBe("11");
  });
});

describe("matchKeyword — word boundaries and diacritics", () => {
  it("matches 'AH' as a standalone token but not embedded in other words", () => {
    expect(matchKeyword(tx({ description: "AH 1234 TILBURG" }), KEYWORDS).category).toBe("01");
    expect(matchKeyword(tx({ description: "BAHRAIN AIRPORT" }), KEYWORDS).category).toBeNull();
  });

  it("matches 'Univé' to keyword 'unive' (diacritic-folded)", () => {
    expect(matchKeyword(tx({ description: "UNIVÉ ZORG" }), KEYWORDS).category).toBe("12");
  });

  it("respects specific-before-generic ordering ('ah to go' before 'ah')", () => {
    const r = matchKeyword(tx({ description: "AH TO GO UTRECHT CS" }), KEYWORDS);
    expect(r.matchedKeyword).toBe("ah to go");
  });

  it("treats a hyphen as a space ('NS-Zaltbommel' matches 'ns zaltbommel')", () => {
    const r = matchKeyword(tx({ description: "NS-Zaltbommel  Zaltbommel" }), KEYWORDS);
    expect(r.category).toBe("07");
    expect(r.matchedKeyword).toBe("ns zaltbommel");
  });
});
