import type { CategoryRates } from "./types";

/**
 * Browser-side fetcher for monthly CBS inflation rates.
 *
 * Goes through the Next.js backend route (`/api/cbs`) so the upstream CBS API
 * is never called directly from the browser. The route is cacheable (24h).
 */
export async function fetchInflationRates(month: string): Promise<CategoryRates> {
  const res = await fetch(`/api/cbs?month=${encodeURIComponent(month)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = typeof body?.error === "string" ? body.error : res.statusText;
    throw new Error(`Failed to fetch CBS rates for ${month}: ${detail}`);
  }
  const data = (await res.json()) as { month: string; rates: CategoryRates };
  return data.rates;
}
