/**
 * Filename and download helpers for the share-PNG.
 *
 * `buildDownloadFilename` is pure and unit-tested. The actual anchor-click
 * trigger lives in a thin DOM-touching helper that we exercise via the
 * manual walkthrough rather than vitest (it would otherwise pull in jsdom
 * just to wrap `document.createElement`).
 */

const NL_MONTH_FULL = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
] as const;

function monthSlug(ym: string): string {
  const [yr, mo] = ym.split("-");
  const idx = Number(mo) - 1;
  const name = NL_MONTH_FULL[idx] ?? mo;
  return `${name}-${yr}`;
}

export function buildDownloadFilename(monthsIncluded: readonly string[]): string {
  if (monthsIncluded.length === 0) return "mijn-inflatie.png";
  if (monthsIncluded.length === 1) {
    return `mijn-inflatie-${monthSlug(monthsIncluded[0])}.png`;
  }
  const first = monthSlug(monthsIncluded[0]);
  const last = monthSlug(monthsIncluded[monthsIncluded.length - 1]);
  return `mijn-inflatie-${first}-tm-${last}.png`;
}

/**
 * Triggers a browser download by appending an anchor, clicking it, and
 * removing it. Same-origin `download` attribute is honoured by all
 * mainstream browsers. No-op on the server.
 */
export function triggerAnchorDownload(href: string, filename: string): void {
  if (typeof document === "undefined") return;
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
