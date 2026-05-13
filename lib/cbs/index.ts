/**
 * Provider registry. The rest of the app imports `cbsProvider` from here, so
 * swapping the mock for a real CBS OData client (table 83131NED) is a
 * one-line change once the upstream API is back.
 */
import { mockProvider } from "./mock-provider";
import type { CbsInflationProvider } from "./types";

export const cbsProvider: CbsInflationProvider = mockProvider;

export { CATEGORIES, CATEGORY_CODES, getCategory } from "./categories";
export {
  CbsDataNotAvailableError,
  type CategoryCode,
  type CategoryMetadata,
  type CategoryRates,
  type CbsInflationProvider,
} from "./types";
