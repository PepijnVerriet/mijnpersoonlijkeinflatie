/**
 * Live CBS Open Data provider. Calls table 86141NED (Consumentenprijzen;
 * CPI 2025=100) and reduces the response to a `CategoryRates` map keyed
 * on our internal CategoryCode (see `lib/cbs/coicop-mapping.ts`).
 *
 * Failure handling: any network/HTTP/parse problem is wrapped in a
 * `CbsApiError`. The caller in `lib/cbs/index.ts` then falls back to the
 * mock provider (principe 31). We do NOT swallow errors here, because the
 * caller needs to know whether the result came from CBS or from the mock
 * so it can flip the `usingMockData` flag.
 */
import {
  CBS_BASE_URL,
  CBS_TABLE_ID,
  cbsKeyToCategoryCode,
} from "./coicop-mapping";
import { CbsApiError } from "./errors";
import {
  JsonFileCbsCache,
  PRODUCTION_CBS_CACHE_PATH,
  type CbsCache,
} from "./cache";
import {
  CbsDataNotAvailableError,
  type CategoryCode,
  type CategoryRates,
  type CbsInflationProvider,
} from "./types";

/**
 * CBS basket-weighted total CPI key in table 86141NED. The odata response
 * pads it to 8 characters with trailing whitespace; we keep the raw form
 * here so the equality check matches verbatim.
 */
const HEADLINE_KEY = "T001112  ";

/**
 * Raw CBS field naam voor jaarmutatie (year-over-year change in %).
 * Niet de "Afgeleid" variant: dat is een door CBS gecorrigeerde reeks
 * waar accijns- en btw-wijzigingen uit zijn gehaald. Wij willen de echte
 * prijsverandering die de consument voelt.
 */
const RATE_FIELD = "JaarmutatieCPI_5";
const FETCH_TIMEOUT_MS = 8000;
const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** "2026-03" → "2026MM03" (CBS periode-formaat). */
function toCbsPeriod(month: string): string {
  const m = MONTH_RE.exec(month);
  if (!m) {
    throw new CbsApiError(`Invalid month format: ${month}`, "parse");
  }
  return `${m[1]}MM${m[2]}`;
}

interface ODataResponse {
  value: Array<Record<string, unknown>>;
}

export class CbsApiProvider implements CbsInflationProvider {
  constructor(private readonly cache: CbsCache) {}

  async getMonthlyRates(month: string): Promise<CategoryRates> {
    const cached = this.cache.getFresh(month);
    if (cached) return cached;
    const { rates } = await this.fetchAndCache(month);
    return rates;
  }

  async getMonthlyHeadline(month: string): Promise<number> {
    const cached = this.cache.getFreshHeadline(month);
    if (cached !== null) return cached;
    const { headline } = await this.fetchAndCache(month);
    if (headline === null) {
      throw new CbsDataNotAvailableError(month);
    }
    return headline;
  }

  /**
   * One odata call → both per-category rates and the headline T001112.
   * Cached together so a subsequent `getMonthlyHeadline` after
   * `getMonthlyRates` (or vice versa) is a no-op.
   */
  private async fetchAndCache(
    month: string,
  ): Promise<{ rates: CategoryRates; headline: number | null }> {
    const period = toCbsPeriod(month);
    const filter = `Perioden eq '${period}'`;
    const url = `${CBS_BASE_URL}/${CBS_TABLE_ID}/TypedDataSet?$filter=${encodeURIComponent(filter)}`;

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isTimeout =
        err instanceof Error &&
        (err.name === "TimeoutError" || err.name === "AbortError");
      throw new CbsApiError(
        `Network error contacting CBS: ${message}`,
        isTimeout ? "timeout" : "network",
      );
    }

    if (!res.ok) {
      throw new CbsApiError(
        `CBS API returned HTTP ${res.status}`,
        "http",
        res.status,
      );
    }

    let json: ODataResponse;
    try {
      json = (await res.json()) as ODataResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new CbsApiError(
        `Failed to parse CBS response: ${message}`,
        "parse",
      );
    }

    if (!json || !Array.isArray(json.value)) {
      throw new CbsApiError(
        "CBS response missing 'value' array",
        "parse",
      );
    }

    const rates: Partial<Record<CategoryCode, number>> = {};
    let headline: number | null = null;
    for (const row of json.value) {
      const cbsKey = String(row.Bestedingscategorieen ?? "");
      const rate = row[RATE_FIELD];
      if (typeof rate !== "number" || !Number.isFinite(rate)) continue;
      if (cbsKey === HEADLINE_KEY) {
        headline = rate;
        continue;
      }
      const code = cbsKeyToCategoryCode(cbsKey);
      if (code === null) continue;
      rates[code] = rate;
    }

    // We expose a `CategoryRates` (Record<CategoryCode, number>) for typing
    // convenience. Consumers (cbs-aggregation) already null-check via
    // `typeof rate === 'number'`, so missing keys (notably "14") are safe.
    const finalRates = rates as CategoryRates;
    this.cache.put(month, finalRates, headline);
    return { rates: finalRates, headline };
  }
}

/**
 * Production singleton. The cache path can be overridden via
 * `CBS_CACHE_PATH` for tests so they don't write to the real cache file.
 */
export const cbsApiProvider: CbsInflationProvider = new CbsApiProvider(
  new JsonFileCbsCache(
    process.env.CBS_CACHE_PATH ?? PRODUCTION_CBS_CACHE_PATH,
  ),
);
