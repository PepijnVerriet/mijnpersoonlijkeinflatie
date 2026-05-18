# Mijn Persoonlijke Inflatie

Web-app waarmee je je persoonlijke inflatie berekent op basis van je eigen
bankafschriften en CBS-cijfers. Je upload één tot twaalf maanden Rabobank-
afschriften (PDF), de app categoriseert je uitgaven volgens CBS COICOP-2018,
en koppelt elk uitgavenpatroon aan de bijbehorende CBS-jaarmutatie. Het
resultaat: één getal dat zegt hoeveel duurder jóuw mandje is geworden,
niet het gemiddelde Nederlandse mandje.

**Status:** v1 in launch. Eerste publieke versie. Alleen Rabobank-PDF.

**Live:** _(URL volgt na Vercel-deployment)_

## Tech stack

- **Next.js 14** (App Router) + TypeScript
- **Anthropic Claude Haiku** voor AI-fallback bij categorisatie
- **CBS Open Data** (tabel 86141NED, COICOP-2018) voor inflatiecijfers
- **Recharts** voor de breakdown-visualisatie
- **Vitest** voor tests
- **Vercel** voor hosting

## Aan de slag

```bash
npm install
cp .env.local.example .env.local   # vul ANTHROPIC_API_KEY in als je live AI wilt
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

Zonder ANTHROPIC_API_KEY werkt de app prima — de AI-fallback valt dan
terug op een deterministische mock-provider. Voor productie-achtige
categorisatie zet je `AI_PROVIDER=anthropic` plus een echte key.

## Scripts

- `npm run dev` — dev-server met hot reload
- `npm run build` — productie-build
- `npm run start` — productie-build serveren
- `npm run lint` — ESLint
- `npm test` — Vitest watch-mode
- `npm run test:run` — Vitest één keer
- `npm run coverage` — coverage-rapport

## Privacy

Deze app slaat niets op. Geen database, geen cookies, geen analytics.
Bankafschriften worden in-memory verwerkt en daarna weggegooid. Lees de
volledige uitleg op [/privacy](./app/privacy/page.tsx).

## Architectuur

Modulair opgebouwd: bank-parsers in `lib/parsers/`, categorizer in
`lib/categorizer/`, CBS-koppeling in `lib/cbs/`, inflatieberekening in
`lib/inflation/`. Zie [`CLAUDE.md`](./CLAUDE.md) voor de volledige
architectuurprincipes.
