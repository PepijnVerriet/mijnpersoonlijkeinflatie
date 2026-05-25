import { ImageResponse } from "@vercel/og";
import {
  decodePeriodParam,
  formatMonthNl,
  formatNumberNl,
} from "@/lib/share/text";

export const runtime = "edge";

// Inline tokens matching app/globals.css. Satori does not read CSS vars.
const C = {
  bg: "#f7f6f3",
  surface: "#ffffff",
  ink1: "#14161a",
  ink2: "#3a3d44",
  ink3: "#6b6e76",
  ink4: "#9a9da4",
  accent: "#1a2a4f",
  border: "#e3dfd5",
  neg: "#a13b1a",
  pos: "#1f6e4a",
  warn: "#8a6a16",
  warnSoft: "#f3ecd6",
} as const;

function buildPeriodLabel(
  from: string,
  to: string,
  isSingleMonth: boolean,
): string {
  return isSingleMonth
    ? formatMonthNl(from)
    : `${formatMonthNl(from)} t/m ${formatMonthNl(to)}`;
}

type Tone = "neg" | "pos" | "neutral";

interface Comparison {
  tone: Tone;
  suffix: string;
}

function compareTone(diff: number): Comparison {
  if (Math.abs(diff) < 0.3) {
    return { tone: "neutral", suffix: "vergelijkbaar met gemiddelde" };
  }
  return diff > 0
    ? { tone: "neg", suffix: "procentpunt hoger" }
    : { tone: "pos", suffix: "procentpunt lager" };
}

function ToneGlyph({ tone, color }: { tone: Tone; color: string }) {
  // Inline SVG renders reliably in Satori; unicode triangles like ▲/▼ are not
  // covered by Source Serif 4 and produce tofu.
  if (tone === "neutral") {
    return (
      <svg width="18" height="18" viewBox="0 0 16 16">
        <rect x="2" y="7" width="12" height="2" fill={color} />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 16 16">
      {tone === "neg" ? (
        <path d="M8 3 L14 13 L2 13 Z" fill={color} />
      ) : (
        <path d="M8 13 L14 3 L2 3 Z" fill={color} />
      )}
    </svg>
  );
}

/**
 * Generic OG card for non-share pages (homepage, /check, /faq, /privacy).
 * Big π glyph + tagline. No personal/reference data.
 */
async function renderGenericCard(): Promise<Response> {
  const [mediumFont, italicFont] = await Promise.all([
    fetch(new URL("./fonts/SourceSerif4-Medium.woff", import.meta.url)).then(
      (r) => r.arrayBuffer(),
    ),
    fetch(
      new URL("./fonts/SourceSerif4-MediumItalic.woff", import.meta.url),
    ).then((r) => r.arrayBuffer()),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: C.bg,
          padding: "60px 72px",
          fontFamily: '"Source Serif 4"',
        }}
      >
        <div style={{ display: "flex" }}>
          <span
            style={{
              fontSize: 20,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: C.ink3,
            }}
          >
            Mijn Persoonlijke Inflatie
          </span>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 56,
            marginTop: 12,
          }}
        >
          <div
            style={{
              fontSize: 360,
              color: C.accent,
              fontStyle: "italic",
              lineHeight: 1,
              fontFeatureSettings: '"ss01"',
            }}
          >
            π
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: "1 1 0",
            }}
          >
            <div
              style={{
                fontSize: 60,
                color: C.ink1,
                letterSpacing: "-0.02em",
                lineHeight: 1.08,
              }}
            >
              De inflatie is voor iedereen
            </div>
            <div
              style={{
                fontSize: 60,
                fontStyle: "italic",
                color: C.accent,
                letterSpacing: "-0.02em",
                lineHeight: 1.08,
              }}
            >
              anders.
            </div>
            <div
              style={{
                marginTop: 26,
                fontSize: 30,
                fontStyle: "italic",
                color: C.ink2,
              }}
            >
              Bereken het cijfer dat jij betaalt.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            borderTop: `1px solid ${C.border}`,
            paddingTop: 22,
            fontSize: 18,
            color: C.ink3,
          }}
        >
          <span>mijnpersoonlijkeinflatie.nl</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Source Serif 4",
          data: mediumFont,
          style: "normal",
          weight: 500,
        },
        {
          name: "Source Serif 4",
          data: italicFont,
          style: "italic",
          weight: 500,
        },
      ],
      headers: {
        "Cache-Control": "public, max-age=86400, immutable",
      },
    },
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const personalRaw = searchParams.get("personal");
  if (personalRaw === null) {
    return renderGenericCard();
  }
  const personal = parseFloat(personalRaw);
  if (!Number.isFinite(personal)) {
    return new Response("Invalid 'personal' parameter", { status: 400 });
  }

  const referenceRaw = searchParams.get("reference");
  let reference: number | undefined;
  if (referenceRaw !== null) {
    const parsed = parseFloat(referenceRaw);
    if (Number.isFinite(parsed)) reference = parsed;
  }

  const periodRaw = searchParams.get("period");
  const period = periodRaw ? decodePeriodParam(periodRaw) : null;
  const periodLabel = period
    ? buildPeriodLabel(period.from, period.to, period.isSingleMonth)
    : null;

  const usingMock = searchParams.get("mock") === "1";

  const [mediumFont, italicFont] = await Promise.all([
    fetch(
      new URL("./fonts/SourceSerif4-Medium.woff", import.meta.url),
    ).then((r) => r.arrayBuffer()),
    fetch(
      new URL("./fonts/SourceSerif4-MediumItalic.woff", import.meta.url),
    ).then((r) => r.arrayBuffer()),
  ]);

  const diff = reference !== undefined ? personal - reference : 0;
  const cmp = compareTone(diff);
  const cmpColor =
    cmp.tone === "neg" ? C.neg : cmp.tone === "pos" ? C.pos : C.ink2;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: C.bg,
          padding: "60px 72px",
          fontFamily: '"Source Serif 4"',
        }}
      >
        {/* Header strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              fontSize: 20,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: C.ink3,
            }}
          >
            Mijn Persoonlijke Inflatie
          </span>
          {usingMock && (
            <span
              style={{
                fontSize: 14,
                padding: "4px 12px",
                backgroundColor: C.warnSoft,
                color: C.warn,
                borderRadius: 4,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              demo waardes
            </span>
          )}
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 56,
            marginTop: 12,
          }}
        >
          {/* Hero */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: "1.1 1 0",
            }}
          >
            <div
              style={{
                fontSize: 168,
                color: C.accent,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {`${formatNumberNl(personal)} %`}
            </div>
            {periodLabel && (
              <div
                style={{
                  marginTop: 28,
                  fontSize: 34,
                  fontStyle: "italic",
                  color: C.ink2,
                }}
              >
                {`over ${periodLabel}`}
              </div>
            )}
          </div>

          {/* Comparison card */}
          {reference !== undefined && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "32px 36px",
                minWidth: 360,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: C.ink3,
                  marginBottom: 18,
                }}
              >
                Nederlands gemiddelde
              </span>
              <span
                style={{
                  fontSize: 60,
                  color: C.ink1,
                  lineHeight: 1,
                }}
              >
                {`${formatNumberNl(reference)} %`}
              </span>
              <div
                style={{
                  marginTop: 22,
                  paddingTop: 16,
                  borderTop: `1px solid ${C.border}`,
                  fontSize: 22,
                  color: cmpColor,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <ToneGlyph tone={cmp.tone} color={cmpColor} />
                <span>
                  {cmp.tone === "neutral"
                    ? cmp.suffix
                    : `${formatNumberNl(Math.abs(diff))} ${cmp.suffix}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `1px solid ${C.border}`,
            paddingTop: 22,
            fontSize: 18,
            color: C.ink3,
          }}
        >
          <span>mijnpersoonlijkeinflatie.nl</span>
          {periodLabel && (
            <span style={{ color: C.ink4 }}>
              {`cijfer voor ${periodLabel}`}
            </span>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Source Serif 4",
          data: mediumFont,
          style: "normal",
          weight: 500,
        },
        {
          name: "Source Serif 4",
          data: italicFont,
          style: "italic",
          weight: 500,
        },
      ],
      headers: {
        "Cache-Control": "public, max-age=86400, immutable",
      },
    },
  );
}
