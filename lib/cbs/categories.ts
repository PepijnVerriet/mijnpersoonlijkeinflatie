import type { CategoryCode, CategoryMetadata } from "./types";

/**
 * The twelve COICOP top-level categories used by the Dutch CBS CPI.
 *
 * Source: CBS StatLine, "Consumentenprijzen; prijsindex 2015=100"
 * (table 83131NED). Names follow the official Dutch labels.
 */
export const CATEGORIES: readonly CategoryMetadata[] = [
  { code: "01", name: "Voedingsmiddelen en alcoholvrije dranken", shortName: "Voeding" },
  { code: "02", name: "Alcoholische dranken en tabak", shortName: "Alcohol & tabak" },
  { code: "03", name: "Kleding en schoenen", shortName: "Kleding" },
  { code: "04", name: "Wonen, water en energie", shortName: "Wonen & energie" },
  { code: "05", name: "Stoffering, huishoudelijke artikelen en gereedschap", shortName: "Huishouden" },
  { code: "06", name: "Gezondheid", shortName: "Gezondheid" },
  { code: "07", name: "Vervoer", shortName: "Vervoer" },
  { code: "08", name: "Communicatie", shortName: "Communicatie" },
  { code: "09", name: "Recreatie en cultuur", shortName: "Recreatie" },
  { code: "10", name: "Onderwijs", shortName: "Onderwijs" },
  { code: "11", name: "Restaurants en hotels", shortName: "Horeca" },
  { code: "12", name: "Diverse goederen en diensten", shortName: "Diversen" },
] as const;

/** All COICOP codes in canonical order. */
export const CATEGORY_CODES: readonly CategoryCode[] = CATEGORIES.map((c) => c.code);

/** Look up category metadata by code. */
export function getCategory(code: CategoryCode): CategoryMetadata {
  const found = CATEGORIES.find((c) => c.code === code);
  if (!found) throw new Error(`Unknown category code: ${code}`);
  return found;
}
