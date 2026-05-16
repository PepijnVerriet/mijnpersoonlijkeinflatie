import type { CategoryCode, CategoryMetadata } from "./types";

/**
 * Top-level categorieën gebruikt voor persoonlijke inflatie.
 *
 * Codes 01-13 zijn CBS COICOP-2018 hoofdafdelingen uit tabel 86141NED.
 * Code 14 (Belastingen) is een project-interne system-category: transacties
 * die hier landen worden uitgefilterd vóór de inflatie-berekening en komen
 * niet voor in UI-dropdowns of breakdowns.
 */
export const CATEGORIES: readonly CategoryMetadata[] = [
  { code: "01", name: "Voeding en alcoholvrije dranken", shortName: "Voeding" },
  { code: "02", name: "Alcoholhoudende dranken en tabak", shortName: "Alcohol & tabak" },
  { code: "03", name: "Kleding en schoenen", shortName: "Kleding" },
  { code: "04", name: "Huisvesting en nutsvoorzieningen", shortName: "Wonen" },
  { code: "05", name: "Huishoudelijke goederen en diensten", shortName: "Huishouden" },
  { code: "06", name: "Gezondheid", shortName: "Gezondheid" },
  { code: "07", name: "Vervoer", shortName: "Vervoer" },
  { code: "08", name: "Informatie en communicatie", shortName: "Communicatie" },
  { code: "09", name: "Recreatie, sport en cultuur", shortName: "Recreatie" },
  { code: "10", name: "Onderwijs", shortName: "Onderwijs" },
  { code: "11", name: "Restaurants en accommodaties", shortName: "Horeca" },
  { code: "12", name: "Verzekeringen en financiële diensten", shortName: "Verzekeringen" },
  { code: "13", name: "Diverse goederen en diensten", shortName: "Diversen" },
  { code: "14", name: "Belastingen", shortName: "Belastingen", systemOnly: true },
] as const;

/** All COICOP codes in canonical order (includes system-only categories). */
export const CATEGORY_CODES: readonly CategoryCode[] = CATEGORIES.map((c) => c.code);

/** Categorieën die in de UI getoond mogen worden (geen system-only). */
export const USER_FACING_CATEGORIES: readonly CategoryMetadata[] =
  CATEGORIES.filter((c) => !c.systemOnly);

/** Codes voor user-facing categorieën, in canonieke volgorde. */
export const USER_FACING_CATEGORY_CODES: readonly CategoryCode[] =
  USER_FACING_CATEGORIES.map((c) => c.code);

/** Look up category metadata by code. */
export function getCategory(code: CategoryCode): CategoryMetadata {
  const found = CATEGORIES.find((c) => c.code === code);
  if (!found) throw new Error(`Unknown category code: ${code}`);
  return found;
}
