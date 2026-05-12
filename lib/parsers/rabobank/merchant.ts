/**
 * Normalization of the merchant/brand name and extraction of the location from
 * a Rabobank card-payment description.
 */

/** Payment-service-provider prefixes that precede the real merchant name. */
const PSP_PREFIX_RE =
  /^(?:BCK\*|CCV\*|SumUp\s?\*|UBR\*\s?|iZ\s?\*|ZTL\*|MOLLIE\*|PAYPRO\*|PAY\.nl\*|MSP\*|NL\d+\s*-\s*)/i;

/** A trailing store/terminal number, e.g. " 199730" in "Jumbo 199730". */
const TRAILING_STORE_NUMBER_RE = /\s+\d{3,}\s*$/;

/** "TILBURG, 5021LG, NLD, 17:36" / "Den Bosch, 5231 DA, NLD, ..." */
const LOCATION_LINE_RE = /^([^,]+?),\s*\d{4}\s?[A-Z]{2},\s*[A-Z]{3}\b/;

/**
 * Turn a raw merchant string into a normalized brand name.
 * Returns null if nothing meaningful is left.
 *
 * @example normalizeMerchant("Jumbo 199730") === "Jumbo"
 * @example normalizeMerchant("BCK*Shell Best") === "Shell Best"
 */
export function normalizeMerchant(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let name = raw.trim().replace(PSP_PREFIX_RE, "").trim();
  name = name.replace(TRAILING_STORE_NUMBER_RE, "").trim();
  name = name.replace(/\s+/g, " ").trim();
  return name.length > 0 ? name : null;
}

/**
 * Find the city/place in a card-payment description (the line that reads
 * "<CITY>, <postcode>, <country>, <time>"). Returns null if not present.
 */
export function extractLocation(fieldLines: readonly string[]): string | null {
  for (const line of fieldLines) {
    const m = line.match(LOCATION_LINE_RE);
    if (m) return m[1].trim();
  }
  return null;
}
