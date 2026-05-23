import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Source-level smoke test for the /api/og PNG route.
 *
 * The route uses @vercel/og's edge runtime (Satori + resvg WASM), which
 * we deliberately don't try to invoke from vitest's node runtime — that
 * would require wiring up an edge polyfill for one test. Instead we
 * assert the file shape that matters for production: edge runtime opt-in,
 * GET export, ImageResponse usage, and presence of the font assets that
 * Next must bundle alongside the route.
 *
 * Visual correctness is verified via a manual walkthrough against the
 * dev server.
 */

const ROUTE_PATH = resolve(process.cwd(), "app/api/og/route.tsx");
const FONT_MEDIUM = resolve(
  process.cwd(),
  "app/api/og/fonts/SourceSerif4-Medium.woff",
);
const FONT_ITALIC = resolve(
  process.cwd(),
  "app/api/og/fonts/SourceSerif4-MediumItalic.woff",
);

describe("/api/og route source", () => {
  it("exists at app/api/og/route.tsx", () => {
    expect(existsSync(ROUTE_PATH)).toBe(true);
  });

  it("exports a GET handler", () => {
    const text = readFileSync(ROUTE_PATH, "utf8");
    expect(text).toMatch(/export\s+async\s+function\s+GET/);
  });

  it("opts into the edge runtime", () => {
    const text = readFileSync(ROUTE_PATH, "utf8");
    expect(text).toMatch(/export\s+const\s+runtime\s*=\s*["']edge["']/);
  });

  it("uses @vercel/og's ImageResponse", () => {
    const text = readFileSync(ROUTE_PATH, "utf8");
    expect(text).toContain("@vercel/og");
    expect(text).toContain("ImageResponse");
  });

  it("references both font files via import.meta.url", () => {
    const text = readFileSync(ROUTE_PATH, "utf8");
    expect(text).toContain("SourceSerif4-Medium.woff");
    expect(text).toContain("SourceSerif4-MediumItalic.woff");
    expect(text).toContain("import.meta.url");
  });

  it("reuses the share-helpers (so display matches the live UI)", () => {
    const text = readFileSync(ROUTE_PATH, "utf8");
    expect(text).toContain("@/lib/share/text");
    expect(text).toContain("formatNumberNl");
    expect(text).toContain("decodePeriodParam");
  });
});

describe("/api/og font assets", () => {
  it("ships the Medium WOFF next to the route", () => {
    expect(existsSync(FONT_MEDIUM)).toBe(true);
  });

  it("ships the MediumItalic WOFF next to the route", () => {
    expect(existsSync(FONT_ITALIC)).toBe(true);
  });

  it("font files carry the WOFF signature 'wOFF'", () => {
    const medium = readFileSync(FONT_MEDIUM);
    expect(medium.subarray(0, 4).toString("ascii")).toBe("wOFF");
    const italic = readFileSync(FONT_ITALIC);
    expect(italic.subarray(0, 4).toString("ascii")).toBe("wOFF");
  });

  it("WOFF assets stay under 100KB each (edge-bundle budget)", () => {
    const m = readFileSync(FONT_MEDIUM).byteLength;
    const i = readFileSync(FONT_ITALIC).byteLength;
    expect(m).toBeLessThan(100_000);
    expect(i).toBeLessThan(100_000);
  });
});
