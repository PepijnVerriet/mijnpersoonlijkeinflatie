import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Source-level smoke test for the ShareSection component on the
 * Resultaat-scherm.
 *
 * The component is a client component with JSX; vitest's node environment
 * can't import it without a React plugin. We therefore assert the shape
 * that matters in production: a `"use client"` directive, the four
 * share-channel buttons, the navigator.share gate, and the wiring into
 * the share-text helpers (so labels and URLs match the wider app).
 *
 * Behaviour-level checks (real clicks, real download trigger, real Web
 * Share API call) are verified via the manual dev-server walkthrough.
 */

const COMPONENT_PATH = resolve(
  process.cwd(),
  "components/wizard/result/ShareSection.tsx",
);
const HOOK_PATH = resolve(process.cwd(), "lib/share/use-can-share.ts");
const STEP_RESULT_PATH = resolve(
  process.cwd(),
  "components/wizard/StepResult.tsx",
);

describe("ShareSection source", () => {
  it("exists at components/wizard/result/ShareSection.tsx", () => {
    expect(existsSync(COMPONENT_PATH)).toBe(true);
  });

  it("opts into the client runtime", () => {
    const text = readFileSync(COMPONENT_PATH, "utf8");
    expect(text).toMatch(/^["']use client["'];?/m);
  });

  it("exports a named ShareSection component", () => {
    const text = readFileSync(COMPONENT_PATH, "utf8");
    expect(text).toMatch(/export\s+function\s+ShareSection/);
  });

  it("wires in the share-text helpers and both detection hooks", () => {
    const text = readFileSync(COMPONENT_PATH, "utf8");
    expect(text).toContain("@/lib/share/text");
    expect(text).toContain("buildLinkedInUrl");
    expect(text).toContain("buildWhatsAppUrl");
    expect(text).toContain("buildXUrl");
    expect(text).toContain("buildShareTargetUrl");
    expect(text).toContain("buildOgImageUrl");
    expect(text).toContain("useCanShare");
    expect(text).toContain("useIsNarrowViewport");
  });

  it("gates the system-share button behind both canShare AND a narrow viewport", () => {
    const text = readFileSync(COMPONENT_PATH, "utf8");
    // The composed condition must require both — desktop with Web Share
    // available should still see the channel chips, not the Deel button.
    expect(text).toMatch(/canShare\s*&&\s*isNarrow/);
  });

  it("uses next/image-friendly anchor tags with rel='noopener noreferrer' on external shares", () => {
    const text = readFileSync(COMPONENT_PATH, "utf8");
    expect(text).toContain('target="_blank"');
    expect(text).toContain('rel="noopener noreferrer"');
  });

  it("renders all four channel labels in Dutch", () => {
    const text = readFileSync(COMPONENT_PATH, "utf8");
    expect(text).toContain("LinkedIn");
    expect(text).toContain("WhatsApp");
    // X label appears inside the JSX <span>X</span>
    expect(text).toMatch(/<span>X<\/span>/);
    expect(text).toContain("Download");
  });

  it("conditionally renders the system-share button on canShare", () => {
    const text = readFileSync(COMPONENT_PATH, "utf8");
    expect(text).toMatch(/canShare\s*&&/);
    // Catches typos that would silently break the AbortError path
    expect(text).toContain("AbortError");
  });

  it("hardcodes SHARE_BASE_URL for outbound share-target URLs", () => {
    // Outbound URLs posted to LinkedIn/WhatsApp/X/Web-Share must be public,
    // never localhost or a Vercel preview — that's the whole point of the
    // hardcoded constant. The component must reach for SHARE_BASE_URL when
    // building the target URL.
    const text = readFileSync(COMPONENT_PATH, "utf8");
    expect(text).toContain("SHARE_BASE_URL");
    expect(text).toMatch(/buildShareTargetUrl\(\s*SHARE_BASE_URL/);
  });

  it("keeps the OG-image URL on the runtime origin (for Download + Web Share file)", () => {
    const text = readFileSync(COMPONENT_PATH, "utf8");
    expect(text).toContain("window.location.origin");
    // Download chip and Web-Share file fetch must use the local origin so
    // dev builds get the locally-rendered PNG.
    expect(text).toMatch(/buildOgImageUrl\(\s*localOrigin/);
  });
});

describe("useCanShare hook source", () => {
  it("exists and is a client-side hook", () => {
    expect(existsSync(HOOK_PATH)).toBe(true);
    const text = readFileSync(HOOK_PATH, "utf8");
    expect(text).toMatch(/^["']use client["'];?/m);
    expect(text).toMatch(/export\s+function\s+useCanShare/);
    expect(text).toContain('"share" in navigator');
  });
});

describe("useIsNarrowViewport hook source", () => {
  const VIEWPORT_HOOK_PATH = resolve(
    process.cwd(),
    "lib/share/use-narrow-viewport.ts",
  );

  it("exists and is a client-side hook that uses matchMedia", () => {
    expect(existsSync(VIEWPORT_HOOK_PATH)).toBe(true);
    const text = readFileSync(VIEWPORT_HOOK_PATH, "utf8");
    expect(text).toMatch(/^["']use client["'];?/m);
    expect(text).toMatch(/export\s+function\s+useIsNarrowViewport/);
    expect(text).toContain("matchMedia");
    expect(text).toContain("max-width:");
  });

  it("defaults to the 768px (Tailwind md) breakpoint", () => {
    const text = readFileSync(VIEWPORT_HOOK_PATH, "utf8");
    expect(text).toMatch(/maxWidth\s*=\s*767/);
  });
});

describe("StepResult wires ShareSection in", () => {
  it("imports ShareSection and removes the placeholder alert", () => {
    const text = readFileSync(STEP_RESULT_PATH, "utf8");
    expect(text).toContain("./result/ShareSection");
    expect(text).toContain("<ShareSection");
    expect(text).not.toContain(
      "Delen van je persoonlijke inflatie komt in een volgende sessie",
    );
  });
});
