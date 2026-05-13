import type { KeywordRule } from "./types";

/**
 * Keyword → COICOP rules. Two clearly-labelled groups:
 *
 *  - Group 1: merchants observed directly in real Rabobank statements
 *    of the project's first user (Tilburg, April 2025). Validated by
 *    appearing in actual transaction data.
 *  - Group 2: large Dutch retailers / service providers not present in
 *    that single dataset but very common nationally.
 *
 * Conventions:
 *  - All keywords are lowercase.
 *  - Matching uses word boundaries + diacritic-folding (see keyword-matcher.ts).
 *  - More specific entries come before more generic ones (first match wins).
 *  - Merchant names normalised by the Rabobank parser strip PSP prefixes
 *    like "BCK*" / "CCV*", so the keyword targets the post-normalisation
 *    name (e.g. "vissers", not "bck vissers").
 */
export const KEYWORDS: readonly KeywordRule[] = [
  // ===========================================================================
  // GROUP 1 — observed in real Rabobank data (Tilburg, April 2025)
  // ===========================================================================

  // 01 Voedingsmiddelen en alcoholvrije dranken
  { keyword: "ah to go", category: "01", note: "AH To Go convenience" },
  { keyword: "albert heijn", category: "01" },
  { keyword: "ah", category: "01", note: "AH-card abbreviation; safe via word boundary" },
  { keyword: "jumbo", category: "01" },
  { keyword: "sligro", category: "01" },
  { keyword: "aldi", category: "01" },
  { keyword: "vissers", category: "01", note: "BCK*Vissers visboer Tilburg" },
  { keyword: "kloosters", category: "01", note: "BCK*Kloosters bakker" },
  { keyword: "maas", category: "01", note: "Speciaalzaak in user data" },

  // 07 Vervoer
  { keyword: "bp kempenbaan", category: "07" },
  { keyword: "bp de rompert", category: "07" },
  { keyword: "bp helvoirt", category: "07" },
  { keyword: "tankstation helvoirt", category: "07" },
  { keyword: "shell", category: "07" },
  { keyword: "easypark", category: "07", note: "Parking app" },
  { keyword: "uber", category: "07" },
  { keyword: "carwash", category: "07" },
  { keyword: "ns zaltbommel", category: "07" },
  { keyword: "total hambake", category: "07", note: "TotalEnergies tankstation, Hambakenwetering Den Bosch" },

  // 11 Restaurants en hotels
  { keyword: "mcdonalds", category: "11" },
  { keyword: "febo", category: "11" },
  { keyword: "cafetaria marktzicht", category: "11" },
  { keyword: "cafe polly maggoo", category: "11" },
  { keyword: "stadsherberg t pum", category: "11" },
  { keyword: "grand cafe de verdraag", category: "11" },
  { keyword: "eetcafe chi", category: "11" },
  { keyword: "de republiek", category: "11" },
  { keyword: "pizzeria grillroom", category: "11" },
  { keyword: "dominos", category: "11" },
  { keyword: "cirfood", category: "11", note: "Bedrijfscatering" },
  { keyword: "studio exploitatie", category: "11" },
  { keyword: "re issue", category: "11" },
  { keyword: "de nacht", category: "11", note: "Tilburg uitgaansgelegenheid" },

  // 03 Kleding en schoenen
  { keyword: "h&m", category: "03" },
  { keyword: "outlet tilburg", category: "03" },
  { keyword: "sparklesbycai", category: "03" },
  { keyword: "decathlon", category: "03", note: "Sportkleding/-artikelen, dominant kleding" },

  // 08 Communicatie
  { keyword: "kpn", category: "08" },

  // 06 Gezondheid
  { keyword: "vgz", category: "06" },
  { keyword: "kruidvat", category: "06", note: "Drogist; in Pepijn-data overwegend gezondheid" },

  // 09 Recreatie en cultuur
  { keyword: "netflix", category: "09" },
  { keyword: "videoland", category: "09" },
  { keyword: "pathe", category: "09", note: "Bioscoop; snackcounter telt ook als 09 voor v1" },
  { keyword: "bibliotheek", category: "09" },

  // 10 Onderwijs
  { keyword: "tilburg university", category: "10" },
  { keyword: "skillsource", category: "10" },

  // 12 Diverse goederen en diensten
  { keyword: "stichting elisabeth", category: "12" },
  { keyword: "frans hommersom", category: "12", note: "Kapper" },

  // ===========================================================================
  // GROUP 2 — large NL retailers / service providers (national coverage)
  // ===========================================================================

  // 01 Supermarkten
  { keyword: "lidl", category: "01" },
  { keyword: "plus", category: "01", note: "Supermarkt-keten; word boundary verkleint risico" },
  { keyword: "spar", category: "01" },
  { keyword: "coop", category: "01" },
  { keyword: "dirk", category: "01", note: "Supermarkt; trade-off met voornaam geaccepteerd" },

  // 03 Kleding
  { keyword: "zalando", category: "03" },

  // 05 Stoffering, huishoudelijke artikelen en gereedschap
  { keyword: "gamma", category: "05" },
  { keyword: "praxis", category: "05" },
  { keyword: "karwei", category: "05" },
  { keyword: "ikea", category: "05" },

  // 06 Gezondheid (zorgverzekeraars)
  { keyword: "cz", category: "06", note: "Zorgverzekeraar" },
  { keyword: "zilveren kruis", category: "06" },
  { keyword: "menzis", category: "06" },
  { keyword: "unive", category: "06", note: "Univé; diakriet-fold maakt match veilig" },

  // 07 Vervoer
  { keyword: "esso", category: "07" },
  { keyword: "texaco", category: "07" },
  { keyword: "tango", category: "07" },
  { keyword: "anwb", category: "07" },
  { keyword: "ns internationaal", category: "07" },
  { keyword: "gvb", category: "07" },
  { keyword: "ret", category: "07", note: "Rotterdamse vervoer; veilig via word boundary" },

  // 08 Communicatie
  { keyword: "t-mobile", category: "08" },
  { keyword: "vodafone", category: "08" },
  { keyword: "ziggo", category: "08" },

  // 09 Recreatie en cultuur (electronica = AV/IT-apparatuur valt onder 09)
  { keyword: "mediamarkt", category: "09" },
  { keyword: "coolblue", category: "09" },

  // 12 Diverse goederen en diensten
  { keyword: "hema", category: "12" },
  { keyword: "action", category: "12" },
  { keyword: "etos", category: "12", note: "Drogist; cosmetica/persoonlijke verzorging → 12" },
  { keyword: "bol.com", category: "12", note: "Brede webshop, voornamelijk divers" },
  { keyword: "wehkamp", category: "12" },
];
