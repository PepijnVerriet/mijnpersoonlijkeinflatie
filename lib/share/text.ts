/**
 * Pure helpers for building share text and URLs used by the Resultaat-scherm
 * share-section, the /share page (OG-meta target), and the /api/og PNG route.
 *
 * Conventions
 * -----------
 * - Numbers are in **percent-units** (e.g. `3.42` means 3,42%), matching the
 *   project-wide convention in `lib/inflation/types.ts`.
 * - Displayed text is Dutch (`nl-NL` locale). The `formatNumberNl` helper
 *   uses a comma decimal separator.
 * - URL query params use a dot decimal (`personal=3.42`) so they round-trip
 *   cleanly through `parseFloat`. The receiving side reformats with a comma
 *   for display.
 * - Period months: a sorted array of `YYYY-MM` strings. Encoded as either
 *   `2026-03` (single) or `2026-01..2026-03` (range) in URLs.
 */

const NL_MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
] as const;

export interface ShareParams {
  /** Personal inflation in percent-units (e.g. 3.42 → 3,42%). */
  personal: number;
  /** CBS reference inflation in percent-units; `undefined` when not available. */
  reference: number | undefined;
  /** Sorted ascending list of `YYYY-MM` months covered by the calculation. */
  monthsIncluded: readonly string[];
  /** True when the calculation fell back to mock CBS data. */
  usingMockData: boolean;
}

export interface DecodedPeriod {
  /** First month of the period, `YYYY-MM`. */
  from: string;
  /** Last month of the period, `YYYY-MM`. */
  to: string;
  /** True when `from === to`. */
  isSingleMonth: boolean;
}

export function formatNumberNl(value: number, decimals = 2): string {
  return value.toLocaleString("nl-NL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatMonthNl(ym: string): string {
  const [yr, mo] = ym.split("-");
  const idx = Number(mo) - 1;
  return `${NL_MONTHS[idx] ?? mo} ${yr}`;
}

export function formatPeriodLabel(months: readonly string[]): string {
  if (months.length === 0) return "deze periode";
  if (months.length === 1) return formatMonthNl(months[0]);
  return `${formatMonthNl(months[0])} t/m ${formatMonthNl(months[months.length - 1])}`;
}

export function encodePeriodParam(months: readonly string[]): string {
  if (months.length === 0) return "";
  if (months.length === 1) return months[0];
  return `${months[0]}..${months[months.length - 1]}`;
}

export function decodePeriodParam(param: string): DecodedPeriod | null {
  const single = /^(\d{4}-\d{2})$/;
  const range = /^(\d{4}-\d{2})\.\.(\d{4}-\d{2})$/;
  const singleMatch = param.match(single);
  if (singleMatch) {
    return { from: singleMatch[1], to: singleMatch[1], isSingleMonth: true };
  }
  const rangeMatch = param.match(range);
  if (rangeMatch) {
    return {
      from: rangeMatch[1],
      to: rangeMatch[2],
      isSingleMonth: rangeMatch[1] === rangeMatch[2],
    };
  }
  return null;
}

export function buildShareSentence(params: ShareParams): string {
  const personalStr = formatNumberNl(params.personal);
  const periodLabel = formatPeriodLabel(params.monthsIncluded);
  return `Mijn inflatie over ${periodLabel} was ${personalStr}%. Bereken jouw inflatie:`;
}

function applyShareParams(url: URL, params: ShareParams): URL {
  url.searchParams.set("personal", params.personal.toFixed(2));
  if (params.reference !== undefined) {
    url.searchParams.set("reference", params.reference.toFixed(2));
  }
  const period = encodePeriodParam(params.monthsIncluded);
  if (period) url.searchParams.set("period", period);
  if (params.usingMockData) url.searchParams.set("mock", "1");
  return url;
}

export function buildShareTargetUrl(baseUrl: string, params: ShareParams): string {
  return applyShareParams(new URL("/share", baseUrl), params).toString();
}

export function buildOgImageUrl(baseUrl: string, params: ShareParams): string {
  return applyShareParams(new URL("/api/og", baseUrl), params).toString();
}

export function buildLinkedInUrl(targetUrl: string): string {
  const url = new URL("https://www.linkedin.com/sharing/share-offsite/");
  url.searchParams.set("url", targetUrl);
  return url.toString();
}

export function buildWhatsAppUrl(targetUrl: string, sentence: string): string {
  const url = new URL("https://wa.me/");
  url.searchParams.set("text", `${sentence} ${targetUrl}`);
  return url.toString();
}

export function buildXUrl(targetUrl: string, sentence: string): string {
  const url = new URL("https://twitter.com/intent/tweet");
  url.searchParams.set("text", sentence);
  url.searchParams.set("url", targetUrl);
  return url.toString();
}
