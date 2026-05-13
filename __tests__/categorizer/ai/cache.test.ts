import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  InMemoryCache,
  JsonFileCache,
  cacheKeyFor,
} from "@/lib/categorizer/ai/cache";
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

describe("cacheKeyFor", () => {
  it("joins merchant and counterpartyName, lowercased and space-normalised", () => {
    const key = cacheKeyFor(tx({ merchant: "  Albert   Heijn ", counterpartyName: "" }));
    expect(key).toBe("albert heijn");
  });

  it("returns null when both merchant and counterpartyName are empty", () => {
    expect(cacheKeyFor(tx({ merchant: null, counterpartyName: null }))).toBeNull();
    expect(cacheKeyFor(tx({ merchant: "", counterpartyName: "" }))).toBeNull();
  });

  it("returns null for iDEAL transactions (code 'id')", () => {
    expect(
      cacheKeyFor(tx({ code: "id", merchant: null, counterpartyName: "Bouman" })),
    ).toBeNull();
  });

  it("returns null for Rabo Betaalverzoek transactions (code 'bv')", () => {
    expect(
      cacheKeyFor(tx({ code: "bv", merchant: null, counterpartyName: "C. Snijers" })),
    ).toBeNull();
  });
});

describe("InMemoryCache", () => {
  it("returns null for an unseen key", () => {
    expect(new InMemoryCache().get("nope")).toBeNull();
  });

  it("returns the value after set", async () => {
    const c = new InMemoryCache();
    await c.set("kpn", "08");
    expect(c.get("kpn")).toBe("08");
  });

  it("can store 'unknown' as a value", async () => {
    const c = new InMemoryCache();
    await c.set("bouman", "unknown");
    expect(c.get("bouman")).toBe("unknown");
  });

  it("overwrites existing entries", async () => {
    const c = new InMemoryCache();
    await c.set("k", "07");
    await c.set("k", "11");
    expect(c.get("k")).toBe("11");
  });
});

describe("JsonFileCache", () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ai-cache-"));
    path = join(dir, "ai-cache.json");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns null when the backing file does not exist yet", () => {
    const c = new JsonFileCache(path);
    expect(c.get("anything")).toBeNull();
    // No file is created until the first set.
    expect(existsSync(path)).toBe(false);
  });

  it("persists entries to disk on set", async () => {
    const c = new JsonFileCache(path);
    await c.set("ikea", "05");

    expect(existsSync(path)).toBe(true);
    const parsed = JSON.parse(readFileSync(path, "utf8")) as {
      entries: Record<string, string>;
      _comment?: string;
    };
    expect(parsed.entries.ikea).toBe("05");
    expect(parsed._comment).toMatch(/v1-keuze/);
  });

  it("re-reads from disk on construction", async () => {
    const first = new JsonFileCache(path);
    await first.set("uber", "07");

    const second = new JsonFileCache(path);
    expect(second.get("uber")).toBe("07");
  });

  it("preserves the _comment field across writes", async () => {
    const c = new JsonFileCache(path);
    await c.set("a", "01");
    await c.set("b", "02");
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { _comment?: string };
    expect(parsed._comment).toMatch(/v1-keuze/);
  });

  it("handles a corrupt JSON file by starting empty", async () => {
    // Pre-populate with garbage.
    const fs = await import("node:fs");
    fs.writeFileSync(path, "not json", "utf8");
    const c = new JsonFileCache(path);
    expect(c.get("anything")).toBeNull();
  });
});
