import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/ui/Topbar";
import { Footer } from "@/components/ui/Footer";
import { Badge } from "@/components/ui/Badge";
import { ArrowIcon, CheckIcon, LockIcon } from "@/components/ui/icons";
import { MorphingHero } from "@/components/landing/MorphingHero";
import { Faq } from "@/components/landing/Faq";
import { getCbsProvider } from "@/lib/cbs";
import { CbsDataNotAvailableError } from "@/lib/cbs/types";
import { SITE_NAME } from "@/lib/seo/constants";

const HOME_TITLE = `Bereken je persoonlijke inflatie · CBS-data en je afschrift`;
const HOME_DESCRIPTION =
  "Upload je Rabobank-PDF en bereken in twee minuten je eigen inflatie op basis van CBS-cijfers. Gratis, geen account, niets opgeslagen.";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "nl_NL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
};

/**
 * Regenerate the landing page at most once per day. CBS publishes headlines
 * monthly around the 6th, so 24h gives us a fresh figure within a day of it
 * landing.
 */
export const revalidate = 86400;

const NL_MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

function fmtNlPct(n: number): string {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtMonthYear(ym: string): string {
  const [yr, mo] = ym.split("-");
  const idx = Number(mo) - 1;
  return `${NL_MONTHS[idx] ?? mo} ${yr}`;
}

/** Generate "YYYY-MM" for `monthsAgo` months back from `now`. */
function monthOffset(now: Date, monthsAgo: number): string {
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Find the most recent month with a CBS headline. CBS publishes on/around
 * the 6th of the following month, so we walk back from "vorige maand" until
 * a month responds. Returns `null` if every attempt fails — the page then
 * renders a graceful fallback paragraph without the figure.
 */
async function fetchLatestHeadline(): Promise<{
  month: string;
  rate: number;
} | null> {
  const cbs = getCbsProvider();
  const now = new Date();
  // Try "vorige maand" first, then walk back. The first 1-3 steps cover the
  // CBS publication lag (CBS publishes around the 6th of the next month).
  // The wider range is for mock-mode in dev: mock data may lag real-world
  // months by a year or more, but the page should still render plausibly.
  for (let i = 1; i <= 12; i++) {
    const month = monthOffset(now, i);
    try {
      const rate = await cbs.provider.getMonthlyHeadline(month);
      return { month, rate };
    } catch (err) {
      if (!(err instanceof CbsDataNotAvailableError)) {
        // Any non-availability error (network, parse) — stop and degrade.
        return null;
      }
    }
  }
  return null;
}

const STEPS: Array<{ n: string; t: string; d: string; meta: string }> = [
  {
    n: "01",
    t: "Upload je afschrift",
    d: "Sleep een PDF-bankafschrift naar de pagina. We accepteren één tot twaalf maanden. Hoe meer maanden, hoe accurater.",
    meta: "PDF · max 10 MB",
  },
  {
    n: "02",
    t: "AI categoriseert",
    d: "Elke transactie wordt automatisch in één van dertien CBS-categorieën geplaatst. Onbekende handelaars markeren we voor jouw controle.",
    meta: "COICOP-2018 · ±3 % handmatig",
  },
  {
    n: "03",
    t: "Jouw cijfer",
    d: "We berekenen je persoonlijke gewichten per categorie, vermenigvuldigen met de CBS-jaarmutatie, en tonen je inflatiepercentage plus breakdown.",
    meta: "Berekening lokaal",
  },
];

const PRIVACY: Array<[string, string]> = [
  [
    "Niets opgeslagen",
    "Geen database. Alleen tijdelijke verwerking, geen permanente opslag van je gegevens.",
  ],
  [
    "Geen cookies, geen tracking",
    "Geen cookies. Geen analytics. Helemaal niets.",
  ],
  [
    "AI ziet alleen handelaar + omschrijving",
    "AI ziet alleen de handelaar of tegenpartij en de transactie-omschrijving. Geen bedragen, geen IBANs, geen jouw eigen naam.",
  ],
  [
    "Open methodologie",
    "Onze berekening is publiek toetsbaar. Bekijk de bronnen op de methodologie-pagina.",
  ],
];

export default async function Home() {
  const headline = await fetchLatestHeadline();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Topbar />

      <main className="flex-1">
        {/* ============ HERO ============ */}
        <section className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-9 px-[22px] py-12 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-20 md:px-24 md:pb-20 md:pt-[100px]">
          <div>
            <div className="mb-6">
              <Badge tone="accent" dot>
                {headline ? `${fmtMonthYear(headline.month)} · CBS COICOP-2018` : "CBS COICOP-2018"}
              </Badge>
            </div>
            <h1 className="m-0 mb-[22px] font-serif text-[42px] font-medium leading-[1.02] tracking-[-0.025em] text-ink-1 text-balance md:text-[68px]">
              De inflatie is voor iedereen{" "}
              <em className="italic text-accent">anders</em>. Wat is die van jou?
            </h1>
            <p className="m-0 mb-8 max-w-[520px] text-base leading-[1.55] text-ink-2 md:text-lg">
              {headline ? (
                <>
                  In {fmtMonthYear(headline.month)} rapporteerde het CBS een
                  inflatie van {fmtNlPct(headline.rate)} %. Maar dat is het
                  gemiddelde van een gemiddeld huishouden.
                </>
              ) : (
                <>
                  Het CBS publiceert maandelijks de gemiddelde inflatie. Maar
                  dat is het gemiddelde van een gemiddeld huishouden.
                </>
              )}{" "}
              Upload je bankafschrift en bereken het cijfer dat{" "}
              <em className="italic">jij</em> betaalt.
            </p>
            <div>
              <Link
                href="/check"
                className="inline-flex h-[50px] items-center justify-center gap-2 whitespace-nowrap rounded-token-sm border border-transparent bg-accent px-6 text-[15px] font-medium tracking-[-0.005em] text-accent-on no-underline transition-colors hover:bg-accent-hover active:translate-y-[0.5px]"
              >
                Bereken je inflatie <ArrowIcon size={14} />
              </Link>
              <p className="m-0 mt-3 text-[13px] text-ink-3">
                Gratis · Geen account · 2 minuten
              </p>
            </div>
          </div>

          <MorphingHero cbsHeadline={headline?.rate ?? null} />
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section className="mx-auto max-w-[1280px] border-t border-border px-[22px] py-10 md:px-24 md:py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="m-0 font-serif text-[28px] font-medium tracking-[-0.02em] md:text-[38px]">
              Drie stappen.
              <br />
              <span className="text-ink-3">Twee minuten.</span>
            </h2>
            <span className="font-mono text-[13px] text-ink-3">
              01 → 02 → 03
            </span>
          </div>
          <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3 md:gap-6">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-token border border-border bg-surface p-7"
              >
                <div className="mb-[18px] font-mono text-xs tracking-[0.04em] text-accent">
                  {s.n}
                </div>
                <h3 className="mb-2.5 text-lg font-medium tracking-[-0.01em]">
                  {s.t}
                </h3>
                <p className="m-0 mb-[18px] text-sm leading-[1.55] text-ink-2">
                  {s.d}
                </p>
                <div className="border-t border-border pt-4 font-mono text-xs text-ink-4">
                  {s.meta}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ PRIVACY STRIP ============ */}
        <section className="border-y border-border bg-surface px-[22px] py-9 md:px-24 md:py-[60px]">
          <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-[60px]">
            <div>
              <div className="mb-3.5">
                <Badge tone="default">
                  <LockIcon size={12} />
                  Privacy
                </Badge>
              </div>
              <h2 className="m-0 font-serif text-[26px] font-medium tracking-[-0.02em] text-balance md:text-[32px]">
                Je gegevens verlaten je sessie nooit.
              </h2>
            </div>
            <div className="grid gap-3.5">
              {PRIVACY.map(([t, d]) => (
                <div
                  key={t}
                  className="grid grid-cols-[20px_1fr] gap-3.5 border-b border-border py-3"
                >
                  <div className="mt-0.5 text-accent">
                    <CheckIcon size={14} />
                  </div>
                  <div>
                    <div className="mb-0.5 text-sm font-medium">{t}</div>
                    <div className="text-[13px] leading-[1.5] text-ink-3">
                      {d}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ METHODOLOGY EXCERPT ============ */}
        <section className="mx-auto max-w-[1280px] px-[22px] py-12 md:px-24 md:py-[88px]">
          <div className="grid grid-cols-1 items-start gap-7 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-20">
            <div>
              <span className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-ink-3">
                Methodologie · in het kort
              </span>
              <h2 className="m-0 mb-[22px] mt-3.5 font-serif text-[28px] font-medium tracking-[-0.02em] md:text-[36px]">
                Geen magie. Wel wiskunde.
              </h2>
              <p className="m-0 mb-[18px] max-w-[540px] text-[15px] leading-[1.65] text-ink-2">
                Het CBS publiceert de jaarmutatie van prijzen per categorie volgens
                de internationale COICOP-classificatie. Wij berekenen jouw
                bestedingsgewicht per categorie op basis van je uitgaven, en
                vermenigvuldigen die met de betreffende CBS-rate. De som is jouw
                persoonlijke inflatie.
              </p>
              <p className="m-0 max-w-[540px] text-[13.5px] leading-[1.6] text-ink-3">
                Dit is een benadering, geen officieel cijfer. Eenmalige aankopen,
                seizoenseffecten en investeringen kunnen het resultaat
                vertekenen. Lees de volledige onderbouwing op de
                methodologie-pagina.
              </p>
            </div>
            <div className="overflow-hidden rounded-token border border-border bg-bg">
              <div className="border-b border-border px-[18px] py-3.5 font-mono text-[11.5px] tracking-[0.04em] text-ink-3">
                FORMULE
              </div>
              <div className="px-6 pb-1 pt-6 font-serif text-[22px] leading-[1.6] tracking-[-0.01em]">
                π<sub className="text-[14px]">jij</sub> &nbsp;=&nbsp; Σ
                <sub className="text-[14px]">i</sub> &nbsp;
                <span className="text-accent">
                  w<sub className="text-[14px]">i</sub>
                </span>{" "}
                ·{" "}
                <span className="text-ink-2">
                  r<sub className="text-[14px]">i</sub>
                </span>
              </div>
              <div className="px-6 pb-6 pt-3 font-sans text-[12.5px] leading-[1.6] text-ink-3">
                <div>
                  <span className="font-mono text-accent">w</span> = jouw aandeel
                  per categorie
                </div>
                <div>
                  <span className="font-mono text-ink-2">r</span> =
                  CBS-jaarmutatie per categorie
                </div>
                <div>
                  <span className="font-mono">i</span> = 13 COICOP-categorieën
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section className="mx-auto max-w-[1280px] px-[22px] pb-12 md:px-24 md:pb-24">
          <Faq />
        </section>

        {/* ============ CTA ============ */}
        <section className="border-t border-border bg-surface px-[22px] py-10 md:px-24 md:py-20">
          <div className="mx-auto max-w-[880px] text-center">
            <h2 className="m-0 mb-[18px] font-serif text-[30px] font-medium tracking-[-0.02em] text-balance md:text-[42px]">
              Het cijfer dat in het nieuws staat is niet het jouwe.
            </h2>
            <p className="m-0 mb-7 text-[15px] leading-[1.6] text-ink-2">
              Binnen twee minuten weet je precies hoeveel duurder jouw leven het
              afgelopen jaar is geworden.
            </p>
            <Link
              href="/check"
              className="inline-flex h-[50px] items-center justify-center gap-2 whitespace-nowrap rounded-token-sm border border-transparent bg-accent px-6 text-[15px] font-medium tracking-[-0.005em] text-accent-on no-underline transition-colors hover:bg-accent-hover active:translate-y-[0.5px]"
            >
              Bereken je inflatie <ArrowIcon size={14} />
            </Link>
            <p className="m-0 mt-3 text-[13px] text-ink-3">
              Gratis · Geen account · 2 minuten
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
