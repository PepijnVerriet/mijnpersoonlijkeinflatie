import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Source-level smoke test for the /share OG-target page.
 *
 * The page is a Next.js server component with JSX, which vitest's node
 * environment can't import without an additional React/JSX plugin. We
 * therefore assert on the source-text shape that matters in production:
 * a generateMetadata export, a default-exported component, the
 * meta-refresh tag, and that the relevant share-text helpers are wired
 * in. The pure helpers themselves are unit-tested in share/text.test.ts.
 *
 * Behaviour-level checks (real redirect, real og:image URL in HTML) are
 * verified via a manual dev-server walkthrough.
 */

const PAGE_PATH = resolve(process.cwd(), "app/share/page.tsx");

describe("/share page source", () => {
  it("exists at app/share/page.tsx", () => {
    expect(existsSync(PAGE_PATH)).toBe(true);
  });

  it("exports an async generateMetadata function", () => {
    const text = readFileSync(PAGE_PATH, "utf8");
    expect(text).toMatch(/export\s+async\s+function\s+generateMetadata/);
  });

  it("exports a default React component", () => {
    const text = readFileSync(PAGE_PATH, "utf8");
    expect(text).toMatch(/export\s+default\s+function\s+SharePage/);
  });

  it("includes a meta-refresh tag pointing to the homepage", () => {
    const text = readFileSync(PAGE_PATH, "utf8");
    expect(text).toContain('httpEquiv="refresh"');
    expect(text).toMatch(/content=["']0;\s*url=\/["']/);
  });

  it("wires in the share-text helpers (so titles match the wider app)", () => {
    const text = readFileSync(PAGE_PATH, "utf8");
    expect(text).toContain("@/lib/share/text");
    expect(text).toContain("buildOgTitle");
    expect(text).toContain("buildOgDescription");
    expect(text).toContain("buildOgImageUrl");
    expect(text).toContain("decodePeriodParam");
  });

  it("uses NEXT_PUBLIC_BASE_URL with a hardcoded fallback", () => {
    const text = readFileSync(PAGE_PATH, "utf8");
    expect(text).toContain("NEXT_PUBLIC_BASE_URL");
    expect(text).toContain("https://mijnpersoonlijkeinflatie.nl");
  });

  it("declares Twitter card type 'summary_large_image'", () => {
    const text = readFileSync(PAGE_PATH, "utf8");
    expect(text).toContain('"summary_large_image"');
  });
});
