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
- Module 4b: CBS-koppeling → BEZIG, mock-laag vanwege CBS-storing
- Module 4c: Categorizer → NOG NIET
- Module 4d: Inflatieberekening → NOG NIET
- Module 4e: UI → NOG NIET

## Open punten voor volgende sessie

- Voor module 4c: iDEAL-transacties tussen vrienden via Rabo Betaalverzoek 
  hebben geen merchant, alleen een omschrijving (bijv. "Sloffen", 
  "Stadscafe"). Categorizer moet voor code "id" en "bv" terugvallen op 
  de description in plaats van de merchant.
- Voor module 4c: merchant-normalisatie van ec-rijen (Uber, etc) is nu 
  best-effort. Verbeteren als categorisatie hierop misgaat.
- CBS API endpoint: https://opendata.cbs.nl/ODataApi/OData/83131NED 
  (basis 2015=100). Storing tijdens setup, controleren bij start 4b.