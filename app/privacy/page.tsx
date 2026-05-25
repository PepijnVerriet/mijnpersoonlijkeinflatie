import type { Metadata } from "next";
import { Topbar } from "@/components/ui/Topbar";
import { Footer } from "@/components/ui/Footer";
import { SITE_NAME } from "@/lib/seo/constants";

const PRIVACY_TITLE = "Privacy-verklaring";
const PRIVACY_DESCRIPTION =
  "Eerlijk over wat we doen met je data: PDF-verwerking, AI-categorisering, hosting en jouw AVG-rechten.";

export const metadata: Metadata = {
  title: PRIVACY_TITLE,
  description: PRIVACY_DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `${PRIVACY_TITLE} · ${SITE_NAME}`,
    description: PRIVACY_DESCRIPTION,
    url: "/privacy",
    siteName: SITE_NAME,
    locale: "nl_NL",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PRIVACY_TITLE} · ${SITE_NAME}`,
    description: PRIVACY_DESCRIPTION,
  },
};

interface SectionProps {
  letter: string;
  title: string;
  children: React.ReactNode;
}

function Section({ letter, title, children }: SectionProps) {
  return (
    <section className="border-t border-border py-8 md:py-10">
      <div className="mb-3 flex items-baseline gap-3">
        <span className="font-mono text-[11.5px] tracking-[0.04em] text-accent">
          {letter}
        </span>
        <h2 className="m-0 font-serif text-[22px] font-medium tracking-[-0.015em] text-ink-1 md:text-[26px]">
          {title}
        </h2>
      </div>
      <div className="space-y-[14px] text-[15px] leading-[1.65] text-ink-2">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Topbar />

      <main className="mx-auto w-full max-w-[800px] flex-1 px-[22px] py-12 md:px-8 md:py-20">
        <header className="mb-8">
          <span className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
            Privacy
          </span>
          <h1 className="m-0 mb-3 mt-3 font-serif text-[34px] font-medium tracking-[-0.025em] text-ink-1 md:text-[44px]">
            Privacy-verklaring
          </h1>
          <p className="m-0 max-w-[600px] font-serif text-[18px] italic leading-[1.5] text-ink-2 md:text-[20px]">
            Eerlijk over wat we doen met je data.
          </p>
        </header>

        <Section letter="A" title="Wat doet de app?">
          <p className="m-0">
            Mijn Persoonlijke Inflatie laat je je eigen inflatie uitrekenen door
            je bankafschrift te vergelijken met cijfers van het CBS. Je uploadt
            een PDF, de app categoriseert je transacties, en toont hoeveel
            duurder jouw uitgavenpatroon is geworden. Geen account, geen
            registratie, geen vervolg-mailtjes.
          </p>
        </Section>

        <Section letter="B" title="Wat gebeurt er met je bankafschrift?">
          <p className="m-0">
            Het PDF-bestand wordt door je browser naar onze server gestuurd,
            daar in het geheugen verwerkt, en dan weggegooid. We schrijven het
            PDF nooit naar disk. De resulterende transactie-lijst leeft alleen
            in je browser-tab — niet in een database, niet in een log. Sluit je
            tab en alles is weg.
          </p>
        </Section>

        <Section letter="C" title="AI-categorisering via Anthropic">
          <p className="m-0">
            Voor transacties die ons keyword-systeem niet herkent, vragen we
            Claude (Anthropic) om een categorie te raden. We sturen per
            transactie alleen drie velden: de naam van de handelaar of
            tegenpartij, de bank-omschrijving, en een tijdelijk ID. We sturen{" "}
            <strong className="font-medium">géén</strong> bedragen, IBANs,
            datums of jouw eigen naam.
          </p>
          <p className="m-0">
            Anthropic verwerkt deze data volgens hun standaard policy: maximaal
            30 dagen bewaard voor misbruik-detectie, niet gebruikt om hun
            modellen te trainen.
          </p>
          <p className="m-0">
            We cachen Claude’s antwoorden lokaal op de server — alleen de
            handelaars-naam (zonder context) als sleutel, en de categorie-code
            als waarde. Deze cache wist bij elke deploy.
          </p>
        </Section>

        <Section letter="D" title="CBS Open Data">
          <p className="m-0">
            De inflatie-cijfers komen van CBS Open Data, tabel 86141NED. We
            doen een anonieme HTTP-call (geen account, geen API-key). CBS ziet
            alleen het IP-adres van onze hosting-provider, niet jou. De
            CBS-data wordt 24 uur gecached om de app sneller te maken.
          </p>
        </Section>

        <Section letter="E" title="Cookie-loze pageview-analytics">
          <p className="m-0">
            Deze app zet geen cookies, geen localStorage, geen sessionStorage.
            Voor pageview-statistiek gebruiken we Vercel Analytics:
            cookie-loos, met geanonimiseerde IP-adressen en zonder persistente
            identifier per bezoeker. We zien geaggregeerd hoeveel mensen welke
            pagina bezoeken, maar niet wie jij bent, hoe vaak je terugkomt of
            welke knoppen je indrukt. Geen Google Analytics, geen Plausible,
            geen Facebook Pixel.
          </p>
        </Section>

        <Section letter="F" title="Hosting via Vercel">
          <p className="m-0">
            De app draait op Vercel. Vercel logt standaard HTTP-requests (URL,
            status, response-tijd) voor de duur van hun retentie-policy. Deze
            logs bevatten geen inhoud van je upload — alleen de metadata van de
            request zelf.
          </p>
        </Section>

        <Section letter="G" title="Jouw rechten (AVG)">
          <p className="m-0">
            Onder de AVG heb je recht op inzage, correctie en verwijdering van
            persoonsgegevens. Omdat we niets opslaan, is er feitelijk weinig te
            wissen. Mocht je toch vragen hebben over data die in Vercel’s logs
            zou kunnen zitten: neem contact op (zie hieronder).
          </p>
        </Section>

        <Section letter="H" title="Contact">
          <p className="m-0">
            Voor vragen of zorgen:{" "}
            <a
              href="https://www.linkedin.com/in/pepijn-verriet-2a6233159/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
            >
              LinkedIn
            </a>
          </p>
        </Section>

        <Section letter="I" title="Laatste update">
          <p className="m-0 text-ink-3">
            Deze verklaring is voor het laatst bijgewerkt op 18 mei 2026.
          </p>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
