import type { CbsClient, CpiDataset } from "./types";

/**
 * Client for the CBS StatLine OData API (CPI per COICOP category).
 *
 * TODO: implement fetching + in-memory/localStorage caching.
 */
export const cbsClient: CbsClient = {
  async getCpi(_from: string, _to: string): Promise<CpiDataset> {
    throw new Error("Not implemented");
  },
};

export type { CbsClient, CpiDataset, CpiDataPoint } from "./types";
