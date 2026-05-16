/**
 * Mapping tussen onze interne CategoryCode (01-14) en de CBS-codering die
 * gebruikt wordt in tabel 86141NED (Consumentenprijzen; CPI 2025=100).
 *
 * CBS hanteert in deze tabel keys met een "CPI"-prefix en zes cijfers,
 * bijvoorbeeld "CPI080000" voor de hoofdafdeling Informatie en communicatie.
 *
 * Niet gemapt:
 * - Onze "14" (Belastingen) — system-only, geen CBS-tegenhanger.
 * - CBS "CPI140000" (Consumptiegebonden belastingen) — andere semantiek.
 * - CBS "CPI150000" (Consumptie in het buitenland) — niet betrouwbaar uit
 *   transactiedata te halen (zie principe 32).
 * - CBS sub-categorieën (bijv. "CPI011000") — alleen hoofdafdelingen.
 * - CBS totaal-key "T001112  " — geen categorie.
 */
import type { CategoryCode } from "./types";

export const CBS_TABLE_ID = "86141NED";
export const CBS_BASE_URL = "https://opendata.cbs.nl/ODataApi/odata";

/** Forward map: CategoryCode → CBS key. `null` voor system-only categorieën. */
const TO_CBS: Readonly<Record<CategoryCode, string | null>> = {
  "01": "CPI010000",
  "02": "CPI020000",
  "03": "CPI030000",
  "04": "CPI040000",
  "05": "CPI050000",
  "06": "CPI060000",
  "07": "CPI070000",
  "08": "CPI080000",
  "09": "CPI090000",
  "10": "CPI100000",
  "11": "CPI110000",
  "12": "CPI120000",
  "13": "CPI130000",
  "14": null,
};

/** Reverse map: CBS key → CategoryCode (alleen de mapbare hoofdafdelingen). */
const FROM_CBS: ReadonlyMap<string, CategoryCode> = new Map(
  (Object.entries(TO_CBS) as [CategoryCode, string | null][])
    .filter((e): e is [CategoryCode, string] => e[1] !== null)
    .map(([code, key]) => [key, code]),
);

/**
 * Converteer een CBS-key naar onze interne code.
 * Retourneert `null` voor sub-categorieën, niet-gebruikte hoofdafdelingen
 * (140000, 150000), de totaalkey, en alle andere onbekende inputs.
 */
export function cbsKeyToCategoryCode(cbsKey: string): CategoryCode | null {
  return FROM_CBS.get(cbsKey) ?? null;
}

/**
 * Converteer een interne code naar de CBS-key voor tabel 86141NED.
 * Retourneert `null` voor system-only categorieën (alleen code "14"),
 * die geen CBS-tegenhanger hebben in onze setup.
 */
export function categoryCodeToCbsKey(code: CategoryCode): string | null {
  return TO_CBS[code];
}
