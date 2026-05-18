import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Smoke test: the privacy page is structural content (no logic to unit-test),
 * so we just assert the file is present and contains all required sections.
 *
 * Rendering the component in vitest would require @vitejs/plugin-react,
 * which we deliberately don't pull in for one smoke test. Reading the
 * source as text catches the failures that actually matter (typo'd
 * section letters, accidental section removal, missing LinkedIn
 * placeholder for the launch follow-up commit).
 */
const PRIVACY_PAGE_PATH = resolve(
  process.cwd(),
  "app/privacy/page.tsx",
);

describe("/privacy page source", () => {
  it("exists at app/privacy/page.tsx", () => {
    expect(existsSync(PRIVACY_PAGE_PATH)).toBe(true);
  });

  it("contains all nine sections (A–I)", () => {
    const text = readFileSync(PRIVACY_PAGE_PATH, "utf8");
    for (const letter of ["A", "B", "C", "D", "E", "F", "G", "H", "I"]) {
      expect(text).toContain(`letter="${letter}"`);
    }
  });

  it("contains the LinkedIn placeholder marker (must be filled in before launch)", () => {
    const text = readFileSync(PRIVACY_PAGE_PATH, "utf8");
    expect(text).toContain("[LinkedIn URL invullen]");
  });
});
