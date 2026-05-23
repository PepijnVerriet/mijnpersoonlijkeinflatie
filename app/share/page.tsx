import type { Metadata } from "next";
import {
  buildOgDescription,
  buildOgImageUrl,
  buildOgTitle,
  decodePeriodParam,
  type ShareParams,
} from "@/lib/share/text";

/**
 * Public share-link target.
 *
 * Social-media scrapers (LinkedIn, Twitter/X, WhatsApp, Slack, …) fetch this
 * URL to render link previews; they parse the initial HTML for OG/Twitter
 * meta tags and ignore meta-refresh. Real visitors get the same HTML plus a
 * `<meta http-equiv="refresh">` that bounces them to the homepage instantly.
 *
 * The OG image points at `/api/og` with the same query-params so each
 * personal share-link produces a personalised card.
 */

const SITE_NAME = "Mijn Persoonlijke Inflatie";
const DEFAULT_BASE_URL = "https://mijnpersoonlijkeinflatie.nl";
const GENERIC_TITLE = SITE_NAME;
const GENERIC_DESCRIPTION =
  "Bereken je eigen inflatie op basis van je Rabobank-afschrift en CBS-cijfers.";

interface PageProps {
  searchParams: {
    personal?: string;
    reference?: string;
    period?: string;
    mock?: string;
  };
}

function parseShareParams(
  searchParams: PageProps["searchParams"],
): ShareParams | null {
  const personal = parseFloat(searchParams.personal ?? "");
  if (!Number.isFinite(personal)) return null;

  const referenceRaw = parseFloat(searchParams.reference ?? "");
  const reference = Number.isFinite(referenceRaw) ? referenceRaw : undefined;

  const period = searchParams.period
    ? decodePeriodParam(searchParams.period)
    : null;
  const monthsIncluded = period
    ? period.isSingleMonth
      ? [period.from]
      : [period.from, period.to]
    : [];

  return {
    personal,
    reference,
    monthsIncluded,
    usingMockData: searchParams.mock === "1",
  };
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? DEFAULT_BASE_URL;
  const shareParams = parseShareParams(searchParams);

  if (shareParams === null) {
    return {
      metadataBase: new URL(baseUrl),
      title: GENERIC_TITLE,
      description: GENERIC_DESCRIPTION,
      openGraph: {
        siteName: SITE_NAME,
        locale: "nl_NL",
        type: "website",
        title: GENERIC_TITLE,
        description: GENERIC_DESCRIPTION,
        url: `${baseUrl}/share`,
      },
      twitter: { card: "summary_large_image" },
    };
  }

  const ogImage = buildOgImageUrl(baseUrl, shareParams);
  const title = buildOgTitle(shareParams);
  const description = buildOgDescription(shareParams);
  const canonicalShareUrl = new URL("/share", baseUrl);
  if (Number.isFinite(shareParams.personal)) {
    canonicalShareUrl.searchParams.set(
      "personal",
      shareParams.personal.toFixed(2),
    );
  }
  if (shareParams.reference !== undefined) {
    canonicalShareUrl.searchParams.set(
      "reference",
      shareParams.reference.toFixed(2),
    );
  }
  if (shareParams.monthsIncluded.length > 0) {
    const months = shareParams.monthsIncluded;
    canonicalShareUrl.searchParams.set(
      "period",
      months.length === 1
        ? months[0]
        : `${months[0]}..${months[months.length - 1]}`,
    );
  }
  if (shareParams.usingMockData) canonicalShareUrl.searchParams.set("mock", "1");

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    openGraph: {
      siteName: SITE_NAME,
      locale: "nl_NL",
      type: "website",
      title,
      description,
      url: canonicalShareUrl.toString(),
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function SharePage() {
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/" />
      <main
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "32px 22px",
          textAlign: "center",
          color: "var(--ink-3)",
        }}
      >
        <p style={{ margin: 0, fontSize: 15 }}>
          Je wordt doorgestuurd naar mijnpersoonlijkeinflatie.nl…
        </p>
        <a
          href="/"
          style={{
            color: "var(--accent)",
            textDecoration: "underline",
            fontSize: 14,
          }}
        >
          Klik hier als de doorverwijzing niet werkt.
        </a>
      </main>
    </>
  );
}
