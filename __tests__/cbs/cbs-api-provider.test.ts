import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CbsApiProvider } from "@/lib/cbs/cbs-api-provider";
import { InMemoryCbsCache } from "@/lib/cbs/cache";

/** Sample CBS payload mimicking real shape (incl. things we should filter). */
function buildPayload() {
  return {
    value: [
      { Bestedingscategorieen: "T001112  ", JaarmutatieCPI_5: 2.7 },
      { Bestedingscategorieen: "CPI010000", JaarmutatieCPI_5: 2.0 },
      { Bestedingscategorieen: "CPI020000", JaarmutatieCPI_5: 2.1 },
      { Bestedingscategorieen: "CPI030000", JaarmutatieCPI_5: 1.3 },
      { Bestedingscategorieen: "CPI040000", JaarmutatieCPI_5: 3.5 },
      { Bestedingscategorieen: "CPI050000", JaarmutatieCPI_5: -0.6 },
      { Bestedingscategorieen: "CPI060000", JaarmutatieCPI_5: 0.7 },
      { Bestedingscategorieen: "CPI070000", JaarmutatieCPI_5: 5.2 },
      { Bestedingscategorieen: "CPI080000", JaarmutatieCPI_5: -1.2 },
      { Bestedingscategorieen: "CPI090000", JaarmutatieCPI_5: 1.8 },
      { Bestedingscategorieen: "CPI100000", JaarmutatieCPI_5: 3.3 },
      { Bestedingscategorieen: "CPI110000", JaarmutatieCPI_5: 4.8 },
      { Bestedingscategorieen: "CPI120000", JaarmutatieCPI_5: 5.0 },
      { Bestedingscategorieen: "CPI130000", JaarmutatieCPI_5: 3.7 },
      // Stuff that must be filtered out by cbsKeyToCategoryCode:
      { Bestedingscategorieen: "CPI140000", JaarmutatieCPI_5: 5.4 },
      { Bestedingscategorieen: "CPI150000", JaarmutatieCPI_5: -0.5 },
      { Bestedingscategorieen: "CPI011000", JaarmutatieCPI_5: 1.7 },
    ],
  };
}

function mockFetch(impl: () => Partial<Response> | Promise<Partial<Response>>): typeof fetch {
  return vi.fn(impl) as unknown as typeof fetch;
}

describe("CbsApiProvider.getMonthlyRates", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns rates for the 13 mappable hoofdafdelingen", async () => {
    globalThis.fetch = mockFetch(() => ({
      ok: true,
      status: 200,
      json: async () => buildPayload(),
    }));
    const provider = new CbsApiProvider(new InMemoryCbsCache());
    const rates = await provider.getMonthlyRates("2026-03");
    expect(Object.keys(rates).sort()).toEqual([
      "01", "02", "03", "04", "05", "06", "07",
      "08", "09", "10", "11", "12", "13",
    ]);
    expect(rates["01"]).toBe(2.0);
    expect(rates["07"]).toBe(5.2);
    expect(rates["13"]).toBe(3.7);
  });

  it("filters out totals, CBS-140000/150000 and sub-categories", async () => {
    globalThis.fetch = mockFetch(() => ({
      ok: true,
      status: 200,
      json: async () => buildPayload(),
    }));
    const provider = new CbsApiProvider(new InMemoryCbsCache());
    const rates = await provider.getMonthlyRates("2026-03");
    // "14" is our system-only code and CPI140000 (consumptiegebonden
    // belastingen) is NOT mapped to it — mapping returns null for both.
    expect("14" in rates).toBe(false);
    // No accidental leakage of sub-categories or totals.
    expect(Object.keys(rates).length).toBe(13);
  });

  it("converts YYYY-MM to YYYYMMxx in the request URL", async () => {
    const fetchSpy = mockFetch(() => ({
      ok: true,
      status: 200,
      json: async () => buildPayload(),
    }));
    globalThis.fetch = fetchSpy;
    const provider = new CbsApiProvider(new InMemoryCbsCache());
    await provider.getMonthlyRates("2026-03");
    const url = (fetchSpy as unknown as { mock: { calls: [string, ...unknown[]][] } })
      .mock.calls[0][0];
    expect(url).toContain("Perioden");
    expect(url).toContain("2026MM03");
    expect(url).toContain("86141NED");
  });

  it("throws CbsApiError(http) on HTTP 500", async () => {
    globalThis.fetch = mockFetch(() => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    }));
    const provider = new CbsApiProvider(new InMemoryCbsCache());
    await expect(provider.getMonthlyRates("2026-03")).rejects.toMatchObject({
      name: "CbsApiError",
      kind: "http",
      status: 500,
    });
  });

  it("throws CbsApiError(network) when fetch rejects", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;
    const provider = new CbsApiProvider(new InMemoryCbsCache());
    await expect(provider.getMonthlyRates("2026-03")).rejects.toMatchObject({
      name: "CbsApiError",
      kind: "network",
    });
  });

  it("throws CbsApiError(parse) when response is missing value array", async () => {
    globalThis.fetch = mockFetch(() => ({
      ok: true,
      status: 200,
      json: async () => ({ notValue: true }),
    }));
    const provider = new CbsApiProvider(new InMemoryCbsCache());
    await expect(provider.getMonthlyRates("2026-03")).rejects.toMatchObject({
      name: "CbsApiError",
      kind: "parse",
    });
  });

  it("throws CbsApiError(parse) on invalid YYYY-MM input", async () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
    const provider = new CbsApiProvider(new InMemoryCbsCache());
    await expect(provider.getMonthlyRates("nonsense")).rejects.toMatchObject({
      name: "CbsApiError",
      kind: "parse",
    });
    // fetch should never have been called when input is invalid.
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("does not call fetch a second time when the cache is fresh", async () => {
    const fetchSpy = mockFetch(() => ({
      ok: true,
      status: 200,
      json: async () => buildPayload(),
    }));
    globalThis.fetch = fetchSpy;
    const provider = new CbsApiProvider(new InMemoryCbsCache());
    await provider.getMonthlyRates("2026-03");
    await provider.getMonthlyRates("2026-03");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe("CbsApiProvider.getMonthlyHeadline", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("parses T001112 from the same odata response as rates", async () => {
    globalThis.fetch = mockFetch(() => ({
      ok: true,
      status: 200,
      json: async () => buildPayload(),
    }));
    const provider = new CbsApiProvider(new InMemoryCbsCache());
    const headline = await provider.getMonthlyHeadline("2026-03");
    expect(headline).toBe(2.7);
  });

  it("shares its fetch with getMonthlyRates (one network call covers both)", async () => {
    const fetchSpy = mockFetch(() => ({
      ok: true,
      status: 200,
      json: async () => buildPayload(),
    }));
    globalThis.fetch = fetchSpy;
    const provider = new CbsApiProvider(new InMemoryCbsCache());
    await provider.getMonthlyRates("2026-03");
    const headline = await provider.getMonthlyHeadline("2026-03");
    expect(headline).toBe(2.7);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("throws CbsDataNotAvailableError when the response lacks T001112", async () => {
    globalThis.fetch = mockFetch(() => ({
      ok: true,
      status: 200,
      json: async () => ({
        value: [
          { Bestedingscategorieen: "CPI010000", JaarmutatieCPI_5: 2.0 },
        ],
      }),
    }));
    const provider = new CbsApiProvider(new InMemoryCbsCache());
    await expect(provider.getMonthlyHeadline("2026-03")).rejects.toMatchObject({
      name: "CbsDataNotAvailableError",
    });
  });
});
