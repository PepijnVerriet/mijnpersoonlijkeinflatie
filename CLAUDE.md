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
- Module 4b: CBS-koppeling → AF met mock-laag, gecommit
- Module 4c-1: Categorizer keyword-engine → AF (78% coverage), gecommit
- Module 4c-2: Categorizer AI-fallback → AF, 93,9% coverage live, gecommit
- Module 4d: Inflatieberekening → AF, gecommit
- Module 4e-1a: Wizard + bank + upload + review → AF, gecommit
- Module 4e-1b: Categorisatie-correctie → NOG NIET
- Module 4e-1c: Resultaat-scherm → NOG NIET
- Module 4e-2: Visuele afwerking, content, copywriting → NOG NIET

## Open punten voor volgende sessie

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
- CBS API endpoint: https://opendata.cbs.nl/ODataApi/OData/83131NED 
  (basis 2015=100). Storing tijdens setup, controleren bij start 4b.

## Lessen uit ontwikkeling

- Keyword-entries in groep 1 (Pepijn's data) moeten gevalideerd worden 
  op werkelijke transactie-context (postcode, merchant-format), niet 
  alleen op naamherkenning. Voorbeeld: "Total Hambake" leek aanvankelijk 
  een horecagelegenheid, bleek een TotalEnergies-tankstation op een 
  bedrijventerrein.