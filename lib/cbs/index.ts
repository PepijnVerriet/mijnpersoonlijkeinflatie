/**
 * CBS provider registry.
 *
 * Per principe 31: in productie wordt altijd eerst de live CBS API
 * geprobeerd; bij API-fout valt elke individuele call automatisch terug
 * op de mock. De wrapper is request-scoped (geen gedeelde state tussen
 * concurrente requests).
 *
 * Tests en lokale dev krijgen standaard direct de mock — geen netwerk,
 * geen kosten — tenzij `CBS_PROVIDER=live` is gezet (zie principe 17 voor
 * het analoge AI_PROVIDER patroon).
 */
import { cbsApiProvider } from "./cbs-api-provider";
import { mockProvider } from "./mock-provider";
import type { CategoryRates, CbsInflationProvider } from "./types";

/**
 * @deprecated Use `getCbsProvider()` instead. Bewaard als alias zodat
 * `lib/inflation/calculator.ts` (waar het de default `cbsProvider`-optie
 * is) en bestaande integratie-tests die op de default leunen blijven
 * compileren. Verwijder zodra alle callers zijn omgezet.
 */
export const cbsProvider: CbsInflationProvider = mockProvider;

export interface ScopedCbsProvider {
  /** The provider to pass into `calculateInflation` / use directly. */
  provider: CbsInflationProvider;
  /**
   * True als minstens één `getMonthlyRates`-call binnen deze scope op de
   * mock is uitgekomen — direct (mock-mode) of via fallback na een
   * live-fout.
   */
  usingMockData: boolean;
}

/**
 * Build a request-scoped CBS provider with automatic fallback to mock.
 *
 * When `CBS_PROVIDER=live` is set, every call tries the live CBS OData
 * API first and falls back to the mock on any `CbsApiError`. Without the
 * env var the function returns the mock directly — no fetch happens.
 *
 * The returned object is fresh per call; `usingMockData` cannot race
 * against concurrent requests.
 */
export function getCbsProvider(): ScopedCbsProvider {
  if (process.env.CBS_PROVIDER !== "live") {
    return { provider: mockProvider, usingMockData: true };
  }
  const scope: ScopedCbsProvider = {
    provider: undefined as unknown as CbsInflationProvider,
    usingMockData: false,
  };
  scope.provider = {
    async getMonthlyRates(month: string): Promise<CategoryRates> {
      try {
        return await cbsApiProvider.getMonthlyRates(month);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(
          `[CBS] live fetch failed for ${month}, falling back to mock:`,
          err instanceof Error ? err.message : err,
        );
        scope.usingMockData = true;
        return mockProvider.getMonthlyRates(month);
      }
    },
    async getMonthlyHeadline(month: string): Promise<number> {
      try {
        return await cbsApiProvider.getMonthlyHeadline(month);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(
          `[CBS] live headline fetch failed for ${month}, falling back to mock:`,
          err instanceof Error ? err.message : err,
        );
        scope.usingMockData = true;
        return mockProvider.getMonthlyHeadline(month);
      }
    },
  };
  return scope;
}

export { CATEGORIES, CATEGORY_CODES, getCategory } from "./categories";
export {
  CbsDataNotAvailableError,
  type CategoryCode,
  type CategoryMetadata,
  type CategoryRates,
  type CbsInflationProvider,
} from "./types";
