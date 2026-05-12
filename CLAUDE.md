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



\## Werkstroom



Start vanuit `lib/parsers/rabobank.ts` met een werkende parser plus tests, 

voordat we naar UI gaan.

## Bank input formats

Parsers in `lib/parsers/` accepteren bank-specifieke input. Het abstracte 
contract: `parse(input: File | Buffer): Promise<Transaction[]>`. De input 
kan PDF, CSV, of XML zijn afhankelijk van de bank. Elke parser is 
verantwoordelijk voor de eigen extractie.

Voor v1: alleen Rabobank PDF rekeningafschriften.