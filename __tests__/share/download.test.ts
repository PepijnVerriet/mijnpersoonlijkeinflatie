import { describe, expect, it } from "vitest";
import { buildDownloadFilename } from "@/lib/share/download";

describe("buildDownloadFilename", () => {
  it("uses a generic filename when no months are provided", () => {
    expect(buildDownloadFilename([])).toBe("mijn-inflatie.png");
  });

  it("encodes a single month with the full Dutch month name + year", () => {
    expect(buildDownloadFilename(["2026-03"])).toBe(
      "mijn-inflatie-maart-2026.png",
    );
  });

  it("uses the first and last month for a range, joined with 'tm'", () => {
    expect(
      buildDownloadFilename(["2025-12", "2026-01", "2026-02", "2026-03"]),
    ).toBe("mijn-inflatie-december-2025-tm-maart-2026.png");
  });

  it("handles a two-month range", () => {
    expect(buildDownloadFilename(["2026-01", "2026-02"])).toBe(
      "mijn-inflatie-januari-2026-tm-februari-2026.png",
    );
  });

  it("falls back to the raw month code on out-of-range months", () => {
    // Latent guard: malformed month codes still produce a valid filename
    // instead of "undefined".
    expect(buildDownloadFilename(["2026-13"])).toBe(
      "mijn-inflatie-13-2026.png",
    );
  });

  it("never contains spaces or characters that Windows file systems reject", () => {
    const fn = buildDownloadFilename(["2025-12", "2026-03"]);
    expect(fn).not.toMatch(/[\s<>:"/\\|?*]/);
  });
});
