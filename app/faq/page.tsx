import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/ui/Topbar";
import { Footer } from "@/components/ui/Footer";
import { ArrowIcon } from "@/components/ui/icons";
import { SITE_NAME } from "@/lib/seo/constants";
import { faqPageJsonLd } from "@/lib/seo/jsonLd";

const FAQ_TITLE = "Veelgestelde vragen";
const FAQ_DESCRIPTION =
  "Antwoorden op vragen over persoonlijke inflatie, CBS-categorisering, ondersteunde banken, privacy en hoe het cijfer berekend wordt.";

export const metadata: Metadata = {
  title: FAQ_TITLE,
  description: FAQ_DESCRIPTION,
  alternates: { canonical: "/faq" },
  openGraph: {
    title: `${FAQ_TITLE} · ${SITE_NAME}`,
    description: FAQ_DESCRIPTION,
    url: "/faq",
    siteName: SITE_NAME,
    locale: "nl_NL",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: `${FAQ_TITLE} · ${SITE_NAME}`,
    description: FAQ_DESCRIPTION,
  },
};

interface FaqEntry {
  id: string;
  question: string;
  paragraphs: string[];
}

const FAQ_ITEMS: FaqEntry[] = [
  {
    id: "wat-is-persoonlijke-inflatie",
    question: "Wat is persoonlijke inflatie?",
    paragraphs: [
      "De inflatie die het CBS maandelijks publiceert is het gemiddelde van een gemiddeld huishouden. Maar geen enkel huishouden besteedt zijn geld precies zoals dat gemiddelde mandje voorschrijft. Wie veel uit eten gaat, voelt prijsstijgingen in restaurants harder. Wie alleen openbaar vervoer gebruikt, merkt niets van duurdere benzine.",
      "Persoonlijke inflatie is hetzelfde rekensommetje dat het CBS doet, maar dan met jóuw uitgavenpatroon. We berekenen welk percentage van je uitgaven naar boodschappen, vervoer, huisvesting et cetera gaat — jouw 'gewichten' — en vermenigvuldigen die met de prijsstijgingen die het CBS per categorie publiceert. Het cijfer dat eruit rolt is het percentage waarmee jouw uitgavenpatroon afgelopen jaar duurder werd.",
    ],
  },
  {
    id: "hoe-werkt-de-app",
    question: "Hoe werkt mijnpersoonlijkeinflatie.nl?",
    paragraphs: [
      "Je uploadt één tot twaalf maanden Rabobank-PDF-afschriften. We lezen elke transactie uit en plaatsen die in één van dertien CBS-categorieën (boodschappen, vervoer, restaurants, et cetera). Een keyword-systeem doet het grove werk; voor handelaars die we niet kennen vraagt de app Claude (Anthropic) om een suggestie. Onbekende of twijfelachtige transacties krijg je ter controle in een correctie-scherm — daar kun je dropdowns aanpassen of transacties uitsluiten.",
      "Daarna halen we bij het CBS de actuele inflatie per categorie op (Open Data, tabel 86141NED, COICOP-2018-classificatie). We berekenen je gewicht per categorie uit je werkelijke uitgaven, vermenigvuldigen met de CBS-jaarmutatie en sommeren. Het hele proces duurt ongeveer twee minuten. Geen account, geen opslag — sluit je tab en je gegevens zijn weg.",
    ],
  },
  {
    id: "waarom-verschilt-mijn-inflatie",
    question: "Waarom verschilt mijn persoonlijke inflatie van het CBS-cijfer?",
    paragraphs: [
      "Het CBS-cijfer is gebaseerd op een mandje met vaste gewichten. Boodschappen tellen daarin voor circa 13% mee, huisvesting voor circa 25%, en zo verder. Die gewichten zijn een gemiddelde over alle Nederlandse huishoudens samen. Als jouw bestedingsmix daarvan afwijkt — en dat doet die — wijkt jouw inflatie automatisch af van het officiële cijfer.",
      "Een paar voorbeelden. Woonlasten zijn de afgelopen jaren harder gestegen dan boodschappen; wie net een hypotheek heeft afgesloten op een dure rente, zit met een veel hoger huisvestings-gewicht en dus een hogere persoonlijke inflatie. Wie zijn auto van de hand heeft gedaan, mist juist de stijging van benzineprijzen. Hoe afwijkender je uitgavenpatroon, hoe verder je van het gemiddelde wegtrekt — in beide richtingen.",
    ],
  },
  {
    id: "ondersteunde-banken",
    question: "Welke banken worden ondersteund?",
    paragraphs: [
      "In versie 1 alleen Rabobank-PDF-rekeningafschriften. De reden is simpel: elke bank gebruikt een eigen PDF-layout en datumformaat. Een Rabobank-parser begrijpt geen ING-PDF en omgekeerd. Het werk zit niet in slimme algoritmes maar in betrouwbaar uitlezen van elke variant per bank.",
      "ING en ABN AMRO staan op de planning. Welke daarna komt hangt af van vraag — meld interesse via de contact-link in de footer als jouw bank er niet bij staat.",
    ],
  },
  {
    id: "aantal-maanden",
    question: "Hoeveel maanden afschriften heb ik nodig?",
    paragraphs: [
      "Eén maand is het minimum, twaalf het maximum. Hoe meer maanden, hoe nauwkeuriger je persoonlijke gewichten zijn.",
      "Bij één maand kan een eenmalige uitgave — een vakantie, een nieuwe wasmachine — je gewichten zwaar vertekenen. Stel dat je in maart een keer voor €1500 op vakantie ging; dan denkt de app dat 'recreatie' jaarrond 30% van je budget vormt, terwijl het in werkelijkheid misschien 8% is. Twaalf maanden middelt zulke uitschieters uit en geeft een uitgavenpatroon dat dichter bij je werkelijke ritme zit.",
      "Vuistregel: één tot drie maanden voor een grove indicatie, zes maanden voor een redelijke schatting, twaalf maanden voor het beste resultaat. De app toont waarschuwingen wanneer je met weinig data werkt.",
    ],
  },
  {
    id: "data-veilig",
    question: "Is mijn data veilig?",
    paragraphs: [
      "Ja, en de architectuur is daarop ingericht. Je PDF wordt door je browser naar onze server gestuurd, daar in het geheugen verwerkt, en direct weggegooid. We schrijven niets naar disk. Er is geen database, geen gebruikersaccount, geen log met je transacties.",
      "Voor onbekende handelaars stuurt de app tekstgegevens naar Anthropic (de makers van Claude): de naam van de tegenpartij en de bank-omschrijving van die specifieke transactie. Géén bedragen, géén IBANs, géén jouw naam. Anthropic bewaart die gegevens maximaal 30 dagen voor misbruikdetectie en gebruikt ze niet om hun modellen te trainen. Voor pageviews zetten we geen cookies; we draaien Vercel Analytics, cookie-loos en geanonimiseerd.",
      "Lees de volledige toelichting op de [privacy-pagina](/privacy).",
    ],
  },
  {
    id: "bronnen",
    question: "Wat zijn de COICOP-categorieën?",
    paragraphs: [
      "COICOP staat voor 'Classification of Individual Consumption According to Purpose' — een internationale standaard voor het indelen van consumentenuitgaven. Het CBS publiceert de Nederlandse inflatie via deze categorieën, en deze app gebruikt dezelfde indeling zodat de cijfers direct vergelijkbaar zijn.",
      "De app werkt met dertien hoofdcategorieën uit de COICOP-2018-versie: voeding, alcohol en tabak, kleding en schoenen, huisvesting, huishoudelijke goederen, gezondheid, vervoer, informatie en communicatie, recreatie en cultuur, onderwijs, restaurants en accommodatie, verzekeringen en financiële diensten, en diverse goederen. Een veertiende categorie — belastingen — wordt door de parser uitgefilterd omdat belastingafdrachten niet onder consumentenprijzen vallen.",
    ],
  },
  {
    id: "methodologie",
    question: "Hoe wordt het cijfer berekend?",
    paragraphs: [
      "De formule is: π_jij = Σ (wᵢ × rᵢ). Per categorie i berekenen we jouw aandeel wᵢ (welk percentage van je uitgaven in die categorie valt) en vermenigvuldigen die met rᵢ — de CBS-jaarmutatie voor die categorie in de maand van je upload. De som over alle dertien categorieën is je persoonlijke inflatie.",
      "Een paar details. Bij meerdere maanden upload wegen we de CBS-jaarmutatie per maand: een dure restaurantmaand laat het inflatie-cijfer voor 'restaurants' zwaarder doortikken dan een goedkope. Transacties die we niet kunnen categoriseren — ongeveer 3-5% in echte data — worden genegeerd: niet meegerekend, niet proportioneel verdeeld. De app toont transparant welk percentage van je uitgaven is meegenomen.",
    ],
  },
  {
    id: "resultaat-delen",
    question: "Kan ik mijn resultaat delen?",
    paragraphs: [
      "Ja. Op het resultaat-scherm vind je een deel-blok met knoppen voor LinkedIn, X, WhatsApp en een download-optie voor de share-afbeelding. De share-link bevat alleen je inflatiepercentage en de maanden waarover je hebt gerekend — geen onderliggende transacties, geen categorie-breakdown, geen persoonlijke gegevens.",
      "Op mobiel gebruikt de app je systeem-deelmenu (Web Share API), zodat je het resultaat ook naar Telegram, Signal of e-mail kunt sturen via dezelfde knop. De afbeelding die social media's tonen bij je link wordt on-the-fly gegenereerd op basis van jouw cijfer.",
    ],
  },
  {
    id: "hoger-of-lager",
    question:
      "Waarom is mijn cijfer hoger of lager dan het Nederlandse gemiddelde?",
    paragraphs: [
      "Als jouw cijfer een procentpunt of meer afwijkt van het CBS-cijfer, betekent dat dat je uitgavenpatroon afwijkt van het gemiddelde Nederlandse huishouden. Hoger of lager hangt af van waar je geld naartoe gaat in vergelijking met die gemiddelde mix.",
      "Typische scenario's voor een hoger cijfer: een groot deel van je uitgaven gaat naar woonlasten in een periode dat huurprijzen of hypotheekrentes harder stijgen dan de rest; je eet veel uit (restaurants stegen 2024-2026 sneller dan boodschappen); je hebt een auto en koopt regelmatig brandstof; je hebt veel abonnementen op streaming, telecom en software.",
      "Typische scenario's voor een lager cijfer: je woont relatief goedkoop ten opzichte van je inkomen; je hebt geen auto; je koopt vooral basis-boodschappen en weinig out-of-home eten; je hebt weinig abonnementsdiensten.",
      "Het is geen wedstrijd — of je cijfer hoger of lager is zegt niets over of je 'goed' of 'verkeerd' bezig bent. Het laat alleen zien hoe jouw bestedingsritme reageert op de prijsbewegingen van het afgelopen jaar.",
    ],
  },
];

const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

function renderParagraph(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(MARKDOWN_LINK)) {
    const [full, label, href] = match;
    const start = match.index ?? 0;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    parts.push(
      <Link
        key={key++}
        href={href}
        className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
      >
        {label}
      </Link>,
    );
    lastIndex = start + full.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function stripMarkdownLinks(text: string): string {
  return text.replace(MARKDOWN_LINK, "$1");
}

const faqJsonLd = faqPageJsonLd(
  FAQ_ITEMS.map((item) => ({
    question: item.question,
    answer: item.paragraphs.map(stripMarkdownLinks).join("\n\n"),
  })),
);

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Topbar />

      <main className="mx-auto w-full max-w-[800px] flex-1 px-[22px] py-12 md:px-8 md:py-20">
        <header className="mb-8">
          <span className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
            FAQ
          </span>
          <h1 className="m-0 mb-3 mt-3 font-serif text-[34px] font-medium tracking-[-0.025em] text-ink-1 md:text-[44px]">
            Veelgestelde vragen
          </h1>
          <p className="m-0 max-w-[600px] font-serif text-[18px] italic leading-[1.5] text-ink-2 md:text-[20px]">
            Wat de app doet, waar je data heen gaat, en hoe het cijfer tot stand
            komt.
          </p>
        </header>

        {FAQ_ITEMS.map((item, idx) => (
          <section
            key={item.id}
            id={item.id}
            className="scroll-mt-24 border-t border-border py-8 md:py-10"
          >
            <div className="mb-3 flex items-baseline gap-3">
              <span className="font-mono text-[11.5px] tracking-[0.04em] text-accent">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <h2 className="m-0 font-serif text-[22px] font-medium tracking-[-0.015em] text-ink-1 md:text-[26px]">
                {item.question}
              </h2>
            </div>
            <div className="space-y-[14px] text-[15px] leading-[1.65] text-ink-2">
              {item.paragraphs.map((p, i) => (
                <p key={i} className="m-0">
                  {renderParagraph(p)}
                </p>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-12 border-t border-border pt-10 text-center">
          <h2 className="m-0 mb-4 font-serif text-[24px] font-medium tracking-[-0.02em] text-ink-1 md:text-[28px]">
            Bereken nu je eigen inflatie
          </h2>
          <p className="m-0 mb-6 text-[14.5px] leading-[1.6] text-ink-3">
            Twee minuten, geen account, niets opgeslagen.
          </p>
          <Link
            href="/check"
            className="inline-flex h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-token-sm border border-transparent bg-accent px-6 text-[15px] font-medium tracking-[-0.005em] text-accent-on no-underline transition-colors hover:bg-accent-hover active:translate-y-[0.5px]"
          >
            Bereken je inflatie <ArrowIcon size={14} />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
