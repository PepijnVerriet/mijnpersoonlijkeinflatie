/**
 * Site-wide SEO constants. Single source of truth for the public origin used
 * in metadata, sitemap, robots.txt and JSON-LD payloads.
 *
 * The base URL is hardcoded (not env-driven) because outbound links must
 * resolve for social-media scrapers and search engines regardless of where
 * the code is rendered (localhost, Vercel preview, production). Mirrors the
 * pattern in `lib/share/text.ts` (`SHARE_BASE_URL`).
 */
export const SITE_URL = "https://mijnpersoonlijkeinflatie.nl";

export const SITE_NAME = "Mijn Persoonlijke Inflatie";

export const SITE_DESCRIPTION =
  "Bereken je eigen inflatie op basis van je Rabobank-afschrift en CBS-cijfers.";
