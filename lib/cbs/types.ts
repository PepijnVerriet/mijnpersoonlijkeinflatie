import type { CoicopCode } from "@/lib/types";

/** A monthly CPI index point for one COICOP category. */
export interface CpiDataPoint {
  /** Period in "YYYY-MM" form. */
  period: string;
  coicop: CoicopCode;
  /** Index value (CBS reference year = 100). */
  index: number;
}

/** A CPI series covering all categories over a period range. */
export interface CpiDataset {
  /** Inclusive start period, "YYYY-MM". */
  from: string;
  /** Inclusive end period, "YYYY-MM". */
  to: string;
  points: CpiDataPoint[];
}

/** Client for fetching (and caching) CBS CPI data per COICOP category. */
export interface CbsClient {
  getCpi(from: string, to: string): Promise<CpiDataset>;
}
