\# Mijn Persoonlijke Inflatie



Web-app waarin gebruikers bankafschriften uploaden om hun persoonlijke 

inflatie te berekenen op basis van CBS COICOP-categorieën.



\## Architectuur



Modulair opgebouwd in losse, onafhankelijke modules:



\- `lib/parsers/` : Bank-specifieke CSV parsers. Elke bank krijgt een eigen 

&#x20; bestand dat een uniforme `Transaction\[]` teruggeeft.

\- `lib/categorizer/` : Logica om transacties te categoriseren in COICOP-

&#x20; categorieën. Begint met keyword-matching.

\- `lib/cbs/` : Ophalen en cachen van CBS CPI-data per categorie.

\- `lib/inflation/` : Berekening van persoonlijke inflatie op basis van 

&#x20; gewichten en CBS-cijfers.

\- `app/` : Next.js pages en routes.

\- `components/` : React UI componenten.



\## Principes



1\. Elke module heeft een duidelijke input/output interface in TypeScript.

2\. Parsers zijn uitwisselbaar: nieuwe bank toevoegen mag de rest niet raken.

3\. Geen database in v1. Data blijft in browser-state.

4\. Schrijf testbestanden voor elke module in `\_\_tests\_\_/`.

5\. Nederlandse UI, Engelse code en comments.

6\. De app ondersteunt uploads van één tot twaalf maanden bankafschriften 
   (Rabobank PDF in v1). Gewichten worden berekend uit alle geüploade 
   transacties samen. De UI moedigt twaalf maanden aan voor een 
   nauwkeurig persoonlijk mandje, maar één maand is ook toegestaan met 
   een waarschuwing over grovere schatting.
7\. CBS-data wordt opgehaald via een Next.js backend route 
   (app/api/cbs/route.ts), nooit direct vanuit de browser. Dit maakt 
   caching mogelijk en biedt fallback bij CBS-storingen.
8\. Inflatieberekening gebruikt per uploadmaand de jaarmutatie van 
   diezelfde maand (jan 2025 vergeleken met jan 2024, niet met huidige).
9. Categorisatie werkt in twee lagen: eerst keyword-matching (hoog 
   vertrouwen, snel, gratis), daarna AI-fallback alleen voor transacties 
   waar geen enkele keyword matcht. Doel: 80-90% keyword-coverage op 
   echte Nederlandse data.

10. Anthropic API-keys staan alleen in environment variables 
    (.env.local, Vercel env vars), nooit in code of git. AI-calls 
    gebeuren server-side via Next.js backend routes.
11. AI-fallback (Claude Haiku) wordt aangeroepen in batches van 10 
    transacties. AI antwoordt per transactie met een categorie OF 
    'unknown'. Geen numerieke confidence scores. Unknown betekent: 
    gebruiker krijgt later in de UI een vraag om handmatig te kiezen.

12. AI-resultaten worden globaal gecached op genormaliseerde 
    merchant-naam (niet per gebruiker, niet inclusief bedragen of 
    persoonlijke data). Cache-bestand: lib/categorizer/data/ai-cache.json.
13. Inflatieberekening: ongematchte/unknown transacties worden genegeerd 
    (niet meegerekend, niet proportioneel verdeeld). UI toont transparant 
    welk percentage van uitgaven is meegenomen.

14. Bij meerdere maanden uploads: CBS-jaarmutatie wordt per categorie 
    gewogen gemiddeld op basis van uitgaven in die categorie per maand. 
    Dus een dure restaurantmaand laat het CBS-cijfer voor categorie 11 
    zwaarder doortikken dan een goedkope restaurantmaand.

15. Module 4d geeft een rijke return-structuur met totaalcijfer, 
    breakdown per categorie, en gewichten. UI (4e) bepaalt welk deel 
    getoond wordt aan welke gebruiker. Toekomstige paywall niet in 
    berekening, alleen in UI-laag.
16. UI is een multi-step wizard op één route (/check) met React state. 
    Geen aparte routes per stap, geen state in URL of localStorage 
    (privacy by design).

17. AI-provider wordt gekozen via env var AI_PROVIDER. Lokaal in 
    .env.local: AI_PROVIDER=mock (geen kosten). Productie in Vercel: 
    AI_PROVIDER=anthropic (live Haiku). Default als var ontbreekt: mock.

18. Resultaat-scherm bevat één visualisatie (chart) plus tabel-breakdown. 
    Recharts als library. Geen dashboard met meerdere charts.

19. UI moet zowel count-based (uncategorizedRatio) als euro-based 
    (uncategorizedSpendingPct) transparantie tonen aan de gebruiker.
20. Categorisatie-correctie (4e-1b) gebruikt hybride aanpak: 
    AI doet eerst een suggestie voor unknowns (best-guess, ook als 
    deze normaal 'unknown' zou retourneren), gebruiker bevestigt of 
    overschrijft via dropdown per transactie. Geen één-voor-één flow.

21. Gebruikerscorrecties worden gelogd naar een aparte file 
    (data/user-corrections.log of equivalent), niet teruggevoerd in 
    de globale AI-cache. Bedoeld voor periodieke handmatige review 
    om keywords.ts uit te breiden. Voorkomt vervuiling tussen gebruikers.

22. Doorgaan zonder alles te corrigeren is toegestaan met gentle nudge: 
    'Je hebt X transacties open, die staan voor Y% van je uitgaven 
    in euro's. Wil je toch doorgaan?'. Niet blokkerend.
    Addendum (v1): niet actief. Dropdowns hebben altijd een waarde 
    (AI-suggestie of user-keuze), dus er is geen "open" transactie. 
    Herzien in v2 als een 'skip'-optie nodig blijkt.
23. Resultaat-scherm toont alle data direct (groot inflatiecijfer, chart, 
    breakdown-tabel, transparantie-blok). Geen collapsible secties; 
    de breakdown is de kern, niet een bonus.

24. Chart in resultaat-scherm: staafdiagram met top-categorieën 
    gesorteerd op bijdrage (gewicht × CBS-rate). Toont visueel welke 
    categorieën de gebruiker's inflatie het hardst veroorzaken.

25. Zolang CBS-API niet bereikbaar is en we mock-data gebruiken: het 
    inflatiecijfer toont een subtiel label 'demo waardes' (klein, grijs, 
    naast het cijfer). Met tooltip of info-icoon voor uitleg.
26. Visuele identiteit: navy accent (#1a2a4f), warm cream achtergrond 
    (#f7f6f3), serif voor cijfers (Source Serif 4), Geist voor UI. 
    Design tokens leven in app/globals.css als CSS custom properties.

27. Styling-aanpak hybride: globale tokens.css voor design-systeem 
    (kleuren, typografie, spacing variables). Tailwind utility classes 
    voor layout (flex, grid, sizing).

28. Referentie-implementatie staat in design-reference/ (gitignored). 
    Niet als productie-code gebruiken; alleen visueel naslagwerk.
29. Wizard-schermen (/check route) gebruiken de Topbar van het nieuwe 
    design voor oriëntatie en wegterug-mogelijkheid, maar geen Footer 
    (om focus op de stap te behouden). Het resultaat-scherm heeft wel 
    een Footer.
30. CBS-koppeling gebruikt tabel 86141NED (Consumentenprijzen; CPI 
    2025=100, index en mutaties) via de Open Data API. Dataset is 
    sinds 2026 in gebruik, vervangt het oude 83131NED met referentiejaar 
    2015. Mapping van interne CategoryCode naar CBS COICOP gebeurt 
    expliciet in lib/cbs/coicop-mapping.ts.

31. CBS-provider implementeert dezelfde interface als de mock-provider 
    (CbsProvider). Bij API-fout: graceful fallback naar mock-provider 
    met logging. Voorkomt dat één CBS-storing de hele app blokkeert.
30. CBS-koppeling gebruikt tabel 86141NED (Consumentenprijzen; CPI 
    2025=100, index en mutaties) via Open Data API. URL-prefix 
    https://opendata.cbs.nl/ODataApi/odata/86141NED. Periode-formaat 
    JJJJMM (bijv. "2026MM03"). Velden via CPI-prefix coderingsschema 
    (bijv. "CPI010000" voor categorie 01).

31. CbsProvider interface: implementaties zijn mockProvider (lokale 
    JSON) en cbsApiProvider (live API). Bij API-fout: graceful fallback 
    naar mock met logging. Voorkomt dat één CBS-storing de app blokkeert.

32. Categorieën uitgebreid van 12 (COICOP-99) naar 14 (COICOP-2018, 
    NL-specifiek). Mapping:
    - 01 Voeding en alcoholvrije dranken
    - 02 Alcoholhoudende dranken en tabak  
    - 03 Kleding en schoenen
    - 04 Huisvesting en nutsvoorzieningen
    - 05 Huishoudelijke goederen en diensten
    - 06 Gezondheid
    - 07 Vervoer
    - 08 Informatie en communicatie (NIEUW)
    - 09 Recreatie, sport en cultuur
    - 10 Onderwijs
    - 11 Restaurants en accommodaties
    - 12 Verzekeringen en financiële diensten (NIEUW)
    - 13 Diverse goederen en diensten (voorheen 12)
    - 14 Belastingen (systeem-categorie, uitgefilterd in parser)
    
    CBS-categorie 150000 (consumptie buitenland) wordt niet gebruikt. 
    Reden: niet betrouwbaar te detecteren in transactie-data.

33. Module 5 gefaseerd: 5a categorieën-definitie, 5b CbsApiProvider, 
    5c mock-data uitbreiden, 5d keywords herwerken, 5e AI-prompts + 
    cache reset, 5f UI controles, 5g end-to-end. Elke stap apart 
    gecommit, niet alles tegelijk.
31. CbsProvider interface: implementaties zijn mockProvider (lokale 
    JSON) en cbsApiProvider (live API). 
    
    Strategie: altijd live in productie, mock alleen als fallback bij 
    API-fout. Bij fallback: usingMockData flag wordt true, "CBS 
    tijdelijk niet bereikbaar" banner verschijnt in UI plus "demo 
    waardes" label naast inflatiecijfer (zoals al geïmplementeerd in 
    4e-1c).
    
    Caching: JSON-bestand met TTL (24h), analoog aan ai-cache.json. 
    Bestand staat in lib/cbs/data/api-cache.json, gitignored.
34. Keywords mapping-keuzes (module 5d):
    - Streaming/games (Spotify, Netflix, Steam): blijven in 09 Recreatie
    - Bankkosten (servicepakketten, betaalrekening): naar 12 Verzekeringen
    - Online cursussen (Coursera, Udemy): naar 10 Onderwijs (geen keywords nu, AI vangt op)
    - Telecom (T-Mobile, KPN, Ziggo): naar 08 Informatie en communicatie
    - Software-abonnementen (Adobe, Microsoft 365): naar 08
    - Verzekeringen (zorg, auto, woon, leven): naar 12
    - Restcategorie (kapper, stomerij): naar 13 Diversen
    - ANWB: blijft op 07 (wegenwacht dominant)
    - MediaMarkt, Coolblue: blijven op 09 (transactie-data toont alleen winkelnaam)
35. Module 6 is opgesplitst:
    - 6a: Filter-bug fix voor maart 2026 PDF (Schotland/Vrij Spaargeld 
      glippen alsnog door, vermoedelijk verschil in PDF-structuur t.o.v. 
      april 2025)
    - 6b: Uitsluit-feature op Review-scherm
      - Toggle per rij (klik = uit, klik weer = in)
      - Visueel markeren (doorgestreept of grijs)
      - Uitgesloten transacties: niet in Correct, niet in calculate
      - Transparantie-blok op Resultaat toont aantal + euro uitgesloten
36. Module 6a-1 fixt 3 pre-existing failures die ontstaan zijn 
    tijdens module 5b/5f door semantiek-wijzigingen (live CBS, 
    fallback, usingMockData detectie). Tests bleven op oud gedrag.

\## Werkstroom



Start vanuit `lib/parsers/rabobank.ts` met een werkende parser plus tests, 

voordat we naar UI gaan.

## Bank input formats

Parsers in `lib/parsers/` accepteren bank-specifieke input. Het abstracte 
contract: `parse(input: File | Buffer): Promise<Transaction[]>`. De input 
kan PDF, CSV, of XML zijn afhankelijk van de bank. Elke parser is 
verantwoordelijk voor de eigen extractie.

Voor v1: alleen Rabobank PDF rekeningafschriften.

## Huidige status

- Module 4a: Rabobank PDF parser → AF, 33 tests groen, gecommit
- Module 4a (filter-fix): interne overboekingen breder uitgefilterd → AF, gecommit
- Module 4b: CBS-koppeling → AF met mock-laag, gecommit
- Module 4c-1: Categorizer keyword-engine → AF (78% coverage), gecommit
- Module 4c-2: Categorizer AI-fallback → AF, 93,9% coverage live, gecommit
- Module 4d: Inflatieberekening → AF, gecommit
- Module 4e-1a: Wizard + bank + upload + review → AF, gecommit
- Module 4e-1b: Categorisatie-correctie → AF, gecommit
- Module 4e-1c: Resultaat-scherm → AF, gecommit
- Module 4e-2 sessie A: Tokens + landingspagina → AF, gecommit
- Module 4e-2 sessie B: Wizard + resultaat migratie → AF, gecommit
- Module 5a: Categorieën definitie + coicop-mapping → AF, gecommit
- Module 5b: CbsApiProvider implementatie → AF, gecommit
- Module 5a: AF, gecommit
- Module 5b: AF, gecommit
- Module 5c: Mock-rates uitbreiden → AF, gecommit
- Module 5d: Keywords herwerken → AF, gecommit (coverage 77% → 79,8%)
- Module 5e: AI-prompts updaten + cache reset → AF, gecommit
- Module 5f: CbsFallbackBanner → AF, gecommit
- Module 5g: End-to-end test → OVERGESLAGEN (vervangen door issue 2 tests)
- Module 6a: Parser-filter fix → AF, gecommit
- Module 6a-1: Test-baseline herstellen → AF, gecommit (3 commits, baseline 259/0)
- Module 6b: Uitsluit-feature → NOG NIET
- Privacy-pagina → NOG NIET
- GitHub + Vercel deployment → NOG NIET


## Open punten voor volgende sessie

- **Privacy-pagina maken** (laatste content-blok voor de app)
- **GitHub repo aanmaken en initiale push**
- **Vercel project setup en deployment**
- **Domain hookup**: mijnpersoonlijkeinflatie.nl koppelen aan Vercel
- **OneDrive issue**: projectmap verplaatsen naar `C:\Dev\` voor schone 
  werkomgeving (OneDrive-sync veroorzaakt soms file-lock issues op 
  node_modules / .next bij dev)
- Optioneel voor v2: "Deel je inflatie" knop activeren (nu placeholder 
  met alert)
- v2 optimalisatie: negative cache binnen calculate-scope om 13× 
  fallback-latency bij CBS-storing te voorkomen. Nu wordt bij elke 
  categorie binnen één request opnieuw geprobeerd live te halen.
- v2: setup-env.ts gebruikt nu per-key delete voor CBS_PROVIDER. 
  Refactoren naar brede whitelist (alleen ANTHROPIC_API_KEY + expliciete 
  ENABLE_LIVE_*_TESTS vlaggen doorlaten) is defensiever tegen toekomstige 
  env-leaks van .env.local naar test-runs.
- v2: cbsApiProvider.getMonthlyRates retourneert {} (geen error) voor 
  onmogelijke maanden zoals "2099-12". Zou een CbsDataNotAvailableError 
  moeten throwen zodat de route consistent 404 retourneert. Latent bug, 
  niet kritiek voor v1.
- v2: Foutmelding bij berekening met nul rates (bijv. ontbrekende 
  mock-maand). Nu valt het stil terug op 0,00%.
- Voor module 4c: iDEAL-transacties tussen vrienden via Rabo Betaalverzoek 
  hebben geen merchant, alleen een omschrijving (bijv. "Sloffen", 
  "Stadscafe"). Categorizer moet voor code "id" en "bv" terugvallen op 
  de description in plaats van de merchant.
- Voor module 4c: merchant-normalisatie van ec-rijen (Uber, etc) is nu 
  best-effort. Verbeteren als categorisatie hierop misgaat.
- 4c-2: Bouman (6x in testdata) is een persoon aan wie via Tikkie 
  meerdere uitgaven werden betaald. AI moet de description achter de 
  naam gebruiken (bijv. "Bouman: Cafetaria Marktzicht" → 11).
- 4c-2: PayPal-betalingen via Luxemburgse IBAN bevatten geen merchant. 
  AI heeft hier mogelijk te weinig context en de gebruiker moet dit 
  handmatig kunnen opvolgen.
- 4c-2: Afkortingen met punten ("Biblioth.M.Brabant") moeten AI 
  herkennen als bibliotheek.
- 4c-2: Total tankstation met store-ID-tussenvoeging ("Total Nn001189 
  Hambake") matcht keyword niet door dat ID. AI moet herkennen dat dit 
  een tankstation is.
- 4e: UI moet zowel count-based (uncategorizedRatio) als euro-based 
  (uncategorizedSpendingPct) transparantie tonen, want die kunnen 27 
  procentpunt uit elkaar liggen op echte data (testdata april 2025: 
  20% transacties vs 47% euro's ongecategoriseerd).
- 4e: UI moet adviseren live AI te gebruiken in productie, want mock 
  AI laat dure transacties als huur door (D. Smits €617 in testdata 
  blijft 'unknown' met mock, live AI gokt redelijk op categorie 04).
- v2 mogelijke verbetering: rijkere prompt voor /api/suggest met 
  description, om edge cases beter te raden (low priority).
- CBS API endpoint: https://opendata.cbs.nl/ODataApi/OData/83131NED 
  (basis 2015=100). Storing tijdens setup, controleren bij start 4b.

## Lessen uit ontwikkeling

- Keyword-entries in groep 1 (Pepijn's data) moeten gevalideerd worden 
  op werkelijke transactie-context (postcode, merchant-format), niet 
  alleen op naamherkenning. Voorbeeld: "Total Hambake" leek aanvankelijk 
  een horecagelegenheid, bleek een TotalEnergies-tankstation op een 
  bedrijventerrein.