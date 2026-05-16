import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SAMPLE_CBS_PAYLOAD = {
  value: [
    { Bestedingscategorieen: "CPI010000", JaarmutatieCPI_5: 2.0 },
    { Bestedingscategorieen: "CPI020000", JaarmutatieCPI_5: 2.1 },
  ],
};

describe("getCbsProvider — default (mock) mode", () => {
  let oldEnv: string | undefined;

  beforeEach(() => {
    oldEnv = process.env.CBS_PROVIDER;
    delete process.env.CBS_PROVIDER;
    vi.resetModules();
  });

  afterEach(() => {
    if (oldEnv === undefined) delete process.env.CBS_PROVIDER;
    else process.env.CBS_PROVIDER = oldEnv;
  });

  it("returns the mockProvider directly with usingMockData=true", async () => {
    const { getCbsProvider } = await import("@/lib/cbs");
    const { mockProvider } = await import("@/lib/cbs/mock-provider");
    const scope = getCbsProvider();
    expect(scope.provider).toBe(mockProvider);
    expect(scope.usingMockData).toBe(true);
  });
});

describe("getCbsProvider — live mode", () => {
  let oldProvider: string | undefined;
  let oldCachePath: string | undefined;
  let tmpDir: string;

  beforeEach(() => {
    oldProvider = process.env.CBS_PROVIDER;
    oldCachePath = process.env.CBS_CACHE_PATH;
    process.env.CBS_PROVIDER = "live";
    tmpDir = mkdtempSync(join(tmpdir(), "cbs-index-"));
    process.env.CBS_CACHE_PATH = join(tmpDir, "api-cache.json");
    vi.resetModules();
  });

  afterEach(() => {
    if (oldProvider === undefined) delete process.env.CBS_PROVIDER;
    else process.env.CBS_PROVIDER = oldProvider;
    if (oldCachePath === undefined) delete process.env.CBS_CACHE_PATH;
    else process.env.CBS_CACHE_PATH = oldCachePath;
    rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("succeeds via live API with usingMockData=false", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => SAMPLE_CBS_PAYLOAD,
    }) as unknown as typeof fetch;

    const { getCbsProvider } = await import("@/lib/cbs");
    const scope = getCbsProvider();
    expect(scope.usingMockData).toBe(false);
    const rates = await scope.provider.getMonthlyRates("2026-03");
    expect(rates["01"]).toBe(2.0);
    expect(scope.usingMockData).toBe(false);
  });

  it("falls back to mock with usingMockData=true on API error", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;
    // Silence the expected warn so the test output stays clean.
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const { getCbsProvider } = await import("@/lib/cbs");
    const scope = getCbsProvider();
    expect(scope.usingMockData).toBe(false);
    // 2025-04 is in the mock-data range so the fallback actually has data.
    const rates = await scope.provider.getMonthlyRates("2025-04");
    expect(rates).toBeDefined();
    expect(typeof rates["01"]).toBe("number");
    expect(scope.usingMockData).toBe(true);
  });

  it("flips usingMockData to true on the first failing call, even if later calls succeed", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn(async () => {
      callCount++;
      if (callCount === 1) throw new Error("flaky");
      return {
        ok: true,
        status: 200,
        json: async () => SAMPLE_CBS_PAYLOAD,
      };
    }) as unknown as typeof fetch;
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const { getCbsProvider } = await import("@/lib/cbs");
    const scope = getCbsProvider();
    await scope.provider.getMonthlyRates("2025-04"); // falls back
    expect(scope.usingMockData).toBe(true);
    await scope.provider.getMonthlyRates("2026-03"); // succeeds via live
    // The flag stays true once tripped — meaningful "this calc used mock somewhere".
    expect(scope.usingMockData).toBe(true);
  });
});
