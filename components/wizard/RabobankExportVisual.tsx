import React from "react";

/**
 * RabobankExportVisual
 *
 * Looping instruction animation: how to export your Rabobank statement
 * PDF from the mobile app and save it on iPhone.
 *
 * Visual approach:
 *   - Fully inline. No <img>, no /public assets, no external libraries.
 *   - Each app screen is redrawn as a minimalist SVG mock — plain text
 *     labels, soft hairlines, navy accent on the one element to tap.
 *   - Inline iPhone frame (generic outline, no Apple-brand details).
 *   - All motion via CSS @keyframes in an inline <style> block.
 *
 * Drop in: `<RabobankExportVisual />` — no props.
 */

/* -------------------------------------------------------------------------- */
/*  Tokens + screen geometry                                                  */
/* -------------------------------------------------------------------------- */

/** Inner phone-screen SVG viewBox. 9 : 19.5 mirrors a modern iPhone. */
const SCREEN_W = 360;
const SCREEN_H = 780;

/** Color tokens — keep in sync with MPI design system. */
const C = {
  bg: "#f7f6f3",
  surface: "#ffffff",
  surface2: "#f1efe9",
  surface3: "#ece9e1",
  ink1: "#14161a",
  ink2: "#3c3f47",
  ink3: "#6b6f78",
  ink4: "#9a9ea7",
  accent: "#1a2a4f",
  accentSoft: "#e6e9f1",
  border: "#e3dfd5",
  borderStrong: "#d4cfc2",
} as const;

/** Typography — falls back if the MPI fonts aren't loaded. */
const FONT_SANS = `"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
const FONT_SERIF = `"Source Serif 4", ui-serif, Georgia, serif`;
const FONT_MONO = `"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;

/* -------------------------------------------------------------------------- */
/*  Timing                                                                    */
/* -------------------------------------------------------------------------- */

/** Per-step hold time, in seconds. */
const STEP_DURATION = 2.3;
/** Outro hold, in seconds. */
const OUTRO_DURATION = 2.5;

/* -------------------------------------------------------------------------- */
/*  Screen primitives                                                         */
/* -------------------------------------------------------------------------- */

const HEADER_Y = 110;
const BODY_TOP = 168;

/** Minimal status-bar suggestion. */
function StatusBar() {
  return (
    <g>
      <text x="22" y="22" fontFamily={FONT_SANS} fontSize="11.5" fontWeight={500} fill={C.ink2}>
        15:03
      </text>
      {/* Signal bars */}
      <g fill={C.ink2}>
        <rect x="280" y="20" width="2" height="3" rx="0.5" />
        <rect x="284" y="18" width="2" height="5" rx="0.5" />
        <rect x="288" y="16" width="2" height="7" rx="0.5" />
        <rect x="292" y="14" width="2" height="9" rx="0.5" />
      </g>
      {/* Wifi (three nested arcs) */}
      <g stroke={C.ink2} fill="none" strokeLinecap="round" strokeWidth="1">
        <path d="M 301 16 Q 307 11 313 16" />
        <path d="M 303.5 19 Q 307 16 310.5 19" />
      </g>
      <circle cx="307" cy="22" r="1" fill={C.ink2} />
      {/* Battery */}
      <g>
        <rect x="320" y="14" width="20" height="10" rx="2.5" fill="none" stroke={C.ink2} strokeWidth="0.9" />
        <rect x="322" y="16" width="13" height="6" rx="1" fill={C.ink2} />
        <rect x="340.7" y="17" width="1.5" height="4" rx="0.6" fill={C.ink2} />
      </g>
    </g>
  );
}

/** Italic serif header in navy — mirrors the Rabobank-app convention. */
function Header({ title, hasBack = false }: { title: string; hasBack?: boolean }) {
  return (
    <g>
      {hasBack && (
        <path
          d="M 22 50 L 12 60 L 22 70"
          stroke={C.ink2}
          fill="none"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <text
        x="22"
        y={HEADER_Y}
        fontFamily={FONT_SERIF}
        fontSize="30"
        fontWeight={500}
        fontStyle="italic"
        fill={C.accent}
      >
        {title}
      </text>
      <line x1="0" y1={HEADER_Y + 28} x2={SCREEN_W} y2={HEADER_Y + 28} stroke={C.border} strokeWidth="1" />
    </g>
  );
}

/** Section label inside the body. */
function SectionLabel({ y, text }: { y: number; text: string }) {
  return (
    <text x="22" y={y} fontFamily={FONT_SANS} fontSize="14" fontWeight={600} fill={C.ink1}>
      {text}
    </text>
  );
}

/** Single tappable row, with optional highlight + sub-label + chevron. */
function ListRow({
  y,
  label,
  sub,
  highlighted = false,
  dim = false,
  hasChevron = true,
  hasIconBullet = true,
}: {
  y: number;
  label: string;
  sub?: string;
  highlighted?: boolean;
  dim?: boolean;
  hasChevron?: boolean;
  hasIconBullet?: boolean;
}) {
  const labelColor = highlighted ? C.accent : dim ? C.ink4 : C.ink1;
  const subColor = highlighted ? C.accent : dim ? C.ink4 : C.ink3;
  const bulletColor = highlighted ? C.accent : dim ? C.ink4 : C.accent;
  const bulletOpacity = highlighted ? 1 : dim ? 0.35 : 0.85;
  const ROW_PAD_X = 14;
  const ROW_H = sub ? 56 : 44;

  return (
    <g>
      {highlighted && (
        <rect
          x={ROW_PAD_X - 4}
          y={y - ROW_H / 2 + 6}
          width={SCREEN_W - (ROW_PAD_X - 4) * 2}
          height={ROW_H}
          rx="10"
          fill={C.accentSoft}
        />
      )}
      {hasIconBullet && (
        <rect
          x={22}
          y={y - 6}
          width="14"
          height="14"
          rx="3"
          fill={bulletColor}
          opacity={bulletOpacity}
        />
      )}
      <text
        x={hasIconBullet ? 48 : 22}
        y={y + 5}
        fontFamily={FONT_SANS}
        fontSize="14.5"
        fontWeight={500}
        fill={labelColor}
      >
        {label}
      </text>
      {sub && (
        <text
          x={hasIconBullet ? 48 : 22}
          y={y + 24}
          fontFamily={FONT_SANS}
          fontSize="11.5"
          fill={subColor}
        >
          {sub}
        </text>
      )}
      {hasChevron && (
        <path
          d={`M ${SCREEN_W - 32} ${y - 5} L ${SCREEN_W - 24} ${y + 2} L ${SCREEN_W - 32} ${y + 9}`}
          stroke={dim ? C.ink4 : C.ink3}
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </g>
  );
}

/** Bottom tab-bar suggestion. Five thin labeled slots. */
function TabBar({ active = -1 }: { active?: number }) {
  const items = ["Overzicht", "Inzicht", "Producten", "Hulp", "Instellingen"];
  const TOP = SCREEN_H - 64;
  const col = SCREEN_W / 5;
  return (
    <g>
      <line x1="0" y1={TOP} x2={SCREEN_W} y2={TOP} stroke={C.border} strokeWidth="1" />
      {items.map((label, i) => {
        const cx = col * i + col / 2;
        const isActive = i === active;
        return (
          <g key={label}>
            <circle
              cx={cx}
              cy={TOP + 22}
              r="6"
              fill="none"
              stroke={isActive ? C.accent : C.ink4}
              strokeWidth="1.4"
            />
            <text
              x={cx}
              y={TOP + 46}
              textAnchor="middle"
              fontFamily={FONT_SANS}
              fontSize="9.5"
              fontWeight={isActive ? 600 : 400}
              fill={isActive ? C.accent : C.ink3}
            >
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  Individual screen renderers                                               */
/* -------------------------------------------------------------------------- */

/** 1. Login — PIN circles fill in to suggest entering a code. */
function ScreenLogin() {
  return (
    <>
      <StatusBar />
      <text
        x={SCREEN_W / 2}
        y={62}
        textAnchor="middle"
        fontFamily={FONT_SANS}
        fontSize="13"
        fontWeight={500}
        fill={C.ink2}
      >
        Rabobank inloggen
      </text>
      <line x1="0" y1="82" x2={SCREEN_W} y2="82" stroke={C.border} strokeWidth="1" />

      <circle cx={SCREEN_W / 2} cy={185} r="38" fill="none" stroke={C.ink3} strokeWidth="1.5" />
      <circle cx={SCREEN_W / 2} cy={177} r="11" fill="none" stroke={C.ink3} strokeWidth="1.5" />
      <path
        d={`M ${SCREEN_W / 2 - 16} 202 Q ${SCREEN_W / 2} 188 ${SCREEN_W / 2 + 16} 202`}
        fill="none"
        stroke={C.ink3}
        strokeWidth="1.5"
      />

      <text
        x={SCREEN_W / 2}
        y={258}
        textAnchor="middle"
        fontFamily={FONT_SANS}
        fontSize="14"
        fontWeight={500}
        fill={C.ink1}
      >
        A. B. C
      </text>

      {/* 5 PIN circles — first three fill in via a CSS animation */}
      <g transform={`translate(${SCREEN_W / 2 - 80}, 308)`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <circle
              cx={i * 40}
              cy={0}
              r="11"
              fill="none"
              stroke={C.accent}
              strokeWidth="1.5"
            />
            <circle
              cx={i * 40}
              cy={0}
              r="11"
              fill={C.accent}
              className={`rev-pin rev-pin--${i}`}
              opacity={0}
            />
          </g>
        ))}
      </g>

      <text
        x={SCREEN_W / 2}
        y={376}
        textAnchor="middle"
        fontFamily={FONT_SANS}
        fontSize="12.5"
        fill={C.ink2}
      >
        Toets je toegangscode in
      </text>

      {/* Numpad hint */}
      <g transform="translate(40, 460)">
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2].map((col) => {
            const n = row === 3 ? (col === 1 ? "0" : "") : `${row * 3 + col + 1}`;
            if (!n) return null;
            return (
              <g key={`${row}-${col}`} transform={`translate(${col * 100}, ${row * 70})`}>
                <circle cx="30" cy="22" r="22" fill={C.surface2} />
                <text
                  x="30"
                  y="30"
                  textAnchor="middle"
                  fontFamily={FONT_SANS}
                  fontSize="20"
                  fontWeight={400}
                  fill={C.ink2}
                >
                  {n}
                </text>
              </g>
            );
          })
        )}
      </g>
    </>
  );
}

/** 2. Dashboard — "Instellingen" tab on the right is highlighted. */
function ScreenOverview() {
  return (
    <>
      <StatusBar />
      <Header title="Overzicht" />

      {/* Action buttons row */}
      <g transform={`translate(0, ${BODY_TOP - 8})`}>
        {[
          { fill: "#2C72D8", label: "Overboeken" },
          { fill: "#D86A2C", label: "Betaalverzoek" },
          { fill: "#2B9F66", label: "Scan QR" },
        ].map((b, i) => (
          <g key={b.label} transform={`translate(${72 + i * 80}, 0)`}>
            <circle cx="0" cy="0" r="22" fill={b.fill} opacity="0.85" />
            <text
              x="0"
              y="44"
              textAnchor="middle"
              fontFamily={FONT_SANS}
              fontSize="10.5"
              fill={C.ink2}
            >
              {b.label}
            </text>
          </g>
        ))}
      </g>

      {/* Betalen card */}
      <g transform="translate(14, 256)">
        <rect width={SCREEN_W - 28} height="120" rx="12" fill={C.surface2} />
        <text x="20" y="28" fontFamily={FONT_SANS} fontSize="15" fontWeight={600} fill={C.ink1}>
          Betalen
        </text>
        <text x="20" y="60" fontFamily={FONT_SANS} fontSize="13" fill={C.ink2}>
          Privé
        </text>
        <rect x="20" y="68" width="100" height="6" rx="2" fill={C.ink4} opacity="0.5" />
        <text x="20" y="96" fontFamily={FONT_SANS} fontSize="13" fill={C.ink2}>
          Zakelijk
        </text>
        <rect x="20" y="104" width="100" height="6" rx="2" fill={C.ink4} opacity="0.5" />
      </g>

      {/* Sparen card */}
      <g transform="translate(14, 392)">
        <rect width={SCREEN_W - 28} height="84" rx="12" fill={C.surface2} />
        <text x="20" y="28" fontFamily={FONT_SANS} fontSize="15" fontWeight={600} fill={C.ink1}>
          Sparen
        </text>
        <text x="20" y="56" fontFamily={FONT_SANS} fontSize="13" fill={C.ink2}>
          Maandbudget
        </text>
        <rect x="20" y="64" width="100" height="6" rx="2" fill={C.ink4} opacity="0.5" />
      </g>

      {/* Tab bar with Instellingen on the right highlighted */}
      <TabBar active={4} />
    </>
  );
}

/** 3. Instellingen — "Documenten" row highlighted. */
function ScreenInstellingen() {
  return (
    <>
      <StatusBar />
      <Header title="Instellingen" />

      <g transform={`translate(0, ${BODY_TOP + 4})`}>
        <circle cx="44" cy="20" r="18" fill="none" stroke={C.ink3} strokeWidth="1.4" />
        <text x="78" y="26" fontFamily={FONT_SANS} fontSize="14.5" fontWeight={500} fill={C.ink1}>
          A. B. C
        </text>
      </g>

      <line x1="0" y1={BODY_TOP + 64} x2={SCREEN_W} y2={BODY_TOP + 64} stroke={C.border} />

      <ListRow y={BODY_TOP + 102} label="Persoonlijke gegevens" sub="Contactgegevens, profielnaam" dim />
      <ListRow y={BODY_TOP + 174} label="Lidmaatschap" sub="Word gratis lid" dim />
      <ListRow y={BODY_TOP + 246} label="Documenten" sub="Jaaroverzicht, afschriften" highlighted />

      <SectionLabel y={BODY_TOP + 326} text="Instellingen voor online bankieren" />
      <ListRow
        y={BODY_TOP + 374}
        label="Toegang, veiligheid en privacy"
        sub="Toegangscode, vingerafdruk"
        dim
      />

      <TabBar active={4} />
    </>
  );
}

/** 4. Documenten — "Rekeningafschriften" row highlighted. */
function ScreenDocumenten() {
  return (
    <>
      <StatusBar />
      <Header title="Documenten" hasBack />

      <g transform={`translate(0, ${BODY_TOP + 10})`}>
        <SectionLabel y={0} text="Jaaroverzichten" />
        <ListRow y={36} label="Financieel Jaaroverzicht" sub="Download voor je belastingaangiften" dim />
        <ListRow y={94} label="Jaaroverzicht Beleggingen" sub="Download voor je belastingaangiften" dim />
      </g>

      <line x1="0" y1={BODY_TOP + 142} x2={SCREEN_W} y2={BODY_TOP + 142} stroke={C.border} />

      <g transform={`translate(0, ${BODY_TOP + 168})`}>
        <SectionLabel y={0} text="Betalen" />
        <ListRow y={48} label="Rekeningafschriften" sub="Bekijk transacties van je betaalrekening" highlighted />
        <ListRow y={114} label="Vergoedingenstaat" sub="Bekijk de kosten van je betaalrekening" dim />
      </g>

      <line x1="0" y1={BODY_TOP + 312} x2={SCREEN_W} y2={BODY_TOP + 312} stroke={C.border} />
      <SectionLabel y={BODY_TOP + 340} text="Verzekeringen" />

      <TabBar active={4} />
    </>
  );
}

/** 5. Rekeningafschriften — dropdown is OPEN, first option highlighted. */
function ScreenDropdown() {
  return (
    <>
      <StatusBar />
      <Header title="Rekeningafschriften" hasBack />

      <text x="22" y={BODY_TOP + 14} fontFamily={FONT_SANS} fontSize="13" fontWeight={600} fill={C.ink1}>
        Rekening
      </text>
      {/* Closed field (in focus, navy border) */}
      <rect
        x="22"
        y={BODY_TOP + 30}
        width={SCREEN_W - 44}
        height="46"
        rx="6"
        fill={C.surface}
        stroke={C.accent}
        strokeWidth="1.5"
      />
      <text
        x="38"
        y={BODY_TOP + 58}
        fontFamily={FONT_SANS}
        fontSize="13"
        fontWeight={500}
        fill={C.ink1}
      >
        NL12 TEST 0123 4567 89 — A.B. Cohen
      </text>
      {/* Chevron-down */}
      <path
        d={`M ${SCREEN_W - 42} ${BODY_TOP + 50} L ${SCREEN_W - 36} ${BODY_TOP + 58} L ${SCREEN_W - 30} ${BODY_TOP + 50}`}
        fill="none"
        stroke={C.accent}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Floating dropdown popover (with subtle shadow) */}
      <g className="rev-dropdown-popover">
        <rect
          x="60"
          y={BODY_TOP + 92}
          width={SCREEN_W - 96}
          height="120"
          rx="10"
          fill={C.surface}
          stroke={C.border}
          strokeWidth="1"
        />
        {/* Option 1 — highlighted */}
        <rect
          x="64"
          y={BODY_TOP + 96}
          width={SCREEN_W - 104}
          height="52"
          rx="6"
          fill={C.accentSoft}
        />
        {/* Check */}
        <path
          d={`M 76 ${BODY_TOP + 122} L 82 ${BODY_TOP + 128} L 94 ${BODY_TOP + 116}`}
          fill="none"
          stroke={C.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="106"
          y={BODY_TOP + 124}
          fontFamily={FONT_SANS}
          fontSize="13"
          fontWeight={500}
          fill={C.accent}
        >
          NL12 TEST 0123 4567 89
        </text>
        <text
          x="106"
          y={BODY_TOP + 140}
          fontFamily={FONT_SANS}
          fontSize="11.5"
          fill={C.accent}
        >
          A.B. Cohen
        </text>

        {/* Option 2 — dimmed */}
        <line x1="76" y1={BODY_TOP + 158} x2={SCREEN_W - 40} y2={BODY_TOP + 158} stroke={C.border} />
        <text
          x="106"
          y={BODY_TOP + 184}
          fontFamily={FONT_SANS}
          fontSize="13"
          fontWeight={500}
          fill={C.ink2}
        >
          NL34 TEST 9876 5432 10
        </text>
        <text
          x="106"
          y={BODY_TOP + 200}
          fontFamily={FONT_SANS}
          fontSize="11.5"
          fill={C.ink3}
        >
          A.B. Cohen
        </text>
      </g>

      <TabBar active={4} />
    </>
  );
}

/** 6. Statement list — vorige maand highlighted. */
function ScreenStatementList() {
  return (
    <>
      <StatusBar />
      <Header title="Rekeningafschriften" hasBack />

      <text x="22" y={BODY_TOP + 8} fontFamily={FONT_SANS} fontSize="13" fontWeight={600} fill={C.ink1}>
        Rekening
      </text>
      <rect x="22" y={BODY_TOP + 22} width={SCREEN_W - 44} height="38" rx="6" fill={C.surface} stroke={C.border} />
      <text x="38" y={BODY_TOP + 46} fontFamily={FONT_SANS} fontSize="12.5" fill={C.ink2}>
        NL34 TEST 9876 5432 10 — A.B. Cohen
      </text>

      <text x="22" y={BODY_TOP + 84} fontFamily={FONT_SANS} fontSize="13" fontWeight={600} fill={C.ink1}>
        Jaar
      </text>
      <rect x="22" y={BODY_TOP + 98} width={SCREEN_W - 44} height="38" rx="6" fill={C.surface} stroke={C.border} />
      <text x="38" y={BODY_TOP + 122} fontFamily={FONT_SANS} fontSize="12.5" fill={C.ink2}>
        2026
      </text>

      {/* 3 rows of statements; April highlighted (vorige maand) */}
      {[
        { date: "2026-05-01", code: "EUR_0137", dim: true },
        { date: "2026-04-01", code: "EUR_0136", dim: false },
        { date: "2026-03-01", code: "EUR_0135", dim: true },
      ].map((row, i) => {
        const y = BODY_TOP + 174 + i * 64;
        return (
          <g key={row.date}>
            {!row.dim && (
              <rect
                x="10"
                y={y - 16}
                width={SCREEN_W - 20}
                height="58"
                rx="10"
                fill={C.accentSoft}
              />
            )}
            <rect
              x={22}
              y={y - 8}
              width="14"
              height="14"
              rx="3"
              fill={row.dim ? C.ink4 : C.accent}
              opacity={row.dim ? 0.35 : 1}
            />
            <text
              x="48"
              y={y + 4}
              fontFamily={FONT_SANS}
              fontSize="13.5"
              fontWeight={500}
              fill={row.dim ? C.ink4 : C.accent}
            >
              Rekeningafschriften {row.date}
            </text>
            <text
              x="48"
              y={y + 22}
              fontFamily={FONT_SANS}
              fontSize="11"
              fill={row.dim ? C.ink4 : C.accent}
            >
              {row.code} · A.B. Cohen
            </text>
            {/* Download arrow */}
            <g
              transform={`translate(${SCREEN_W - 38}, ${y - 2})`}
              stroke={row.dim ? C.ink4 : C.accent}
              fill="none"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M 0 0 L 0 14" />
              <path d="M -5 9 L 0 14 L 5 9" />
            </g>
          </g>
        );
      })}

      <TabBar active={4} />
    </>
  );
}

/** 7. PDF preview — share icon top-left highlighted. */
function ScreenPdfPreview() {
  return (
    <>
      <StatusBar />

      {/* Top action row */}
      <g>
        {/* Share icon container — highlighted */}
        <rect x="14" y="50" width="44" height="44" rx="10" fill={C.accentSoft} />
        <g
          transform="translate(36, 72)"
          stroke={C.accent}
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 0 -10 L 0 6" />
          <path d="M -5 -5 L 0 -10 L 5 -5" />
          <path d="M -8 0 L -8 12 L 8 12 L 8 0" />
        </g>

        <text
          x={SCREEN_W / 2}
          y={78}
          textAnchor="middle"
          fontFamily={FONT_SANS}
          fontSize="14"
          fontWeight={500}
          fill={C.ink1}
        >
          Document bekijken
        </text>

        {/* X close */}
        <g
          transform={`translate(${SCREEN_W - 36}, 72)`}
          stroke={C.ink2}
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <line x1="-6" y1="-6" x2="6" y2="6" />
          <line x1="6" y1="-6" x2="-6" y2="6" />
        </g>
        <line x1="0" y1="104" x2={SCREEN_W} y2="104" stroke={C.border} />
      </g>

      {/* Stylized PDF page */}
      <g transform="translate(28, 124)">
        <rect width={SCREEN_W - 56} height="540" rx="6" fill={C.surface} stroke={C.border} />

        {/* Rabo header strip */}
        <text x="14" y="26" fontFamily={FONT_SERIF} fontSize="11" fontStyle="italic" fill={C.ink2}>
          Rabobank
        </text>
        <text x="14" y="44" fontFamily={FONT_SERIF} fontSize="13" fontStyle="italic" fill={C.accent}>
          Rekeningafschrift
        </text>
        {/* Small navy logo placeholder */}
        <rect x={(SCREEN_W - 56) / 2 - 12} y="16" width="24" height="24" rx="4" fill={C.accent} opacity="0.85" />
        <text
          x={SCREEN_W - 56 - 14}
          y="28"
          textAnchor="end"
          fontFamily={FONT_MONO}
          fontSize="8"
          fill={C.ink3}
        >
          Bankcode 1219
        </text>

        {/* Address block */}
        {[60, 70, 80, 90].map((y) => (
          <rect key={y} x="14" y={y} width={70 + Math.random() * 30} height="3" rx="1" fill={C.ink4} opacity="0.55" />
        ))}

        {/* Meta panel */}
        <rect x={SCREEN_W - 56 - 130} y="62" width="116" height="58" fill="none" stroke={C.border} />
        {[72, 84, 96, 108].map((y) => (
          <rect key={y} x={SCREEN_W - 56 - 124} y={y} width="100" height="2.5" rx="1" fill={C.ink4} opacity="0.5" />
        ))}

        {/* Transaction table */}
        <line x1="14" y1="140" x2={SCREEN_W - 56 - 14} y2="140" stroke={C.border} />
        {Array.from({ length: 14 }).map((_, i) => (
          <g key={i} transform={`translate(14, ${152 + i * 20})`}>
            <rect x="0" y="0" width="22" height="2.5" rx="1" fill={C.ink4} opacity="0.55" />
            <rect x="34" y="0" width={120 + (i % 3) * 14} height="2.5" rx="1" fill={C.ink3} opacity="0.55" />
            <rect x="34" y="6" width="80" height="2.5" rx="1" fill={C.ink4} opacity="0.4" />
            <rect x={SCREEN_W - 56 - 70} y="0" width="26" height="2.5" rx="1" fill={C.ink3} opacity="0.7" />
          </g>
        ))}
      </g>
    </>
  );
}

/** 8. iOS share sheet — "Bewaar in Bestanden" highlighted. */
function ScreenShareSheet() {
  // Reuse a faint PDF preview behind the dimmed top portion
  return (
    <>
      <StatusBar />

      {/* Dimmed top — faint hint of the previous PDF screen */}
      <rect x="0" y="32" width={SCREEN_W} height="190" fill={C.surface2} opacity="0.6" />
      <rect x="48" y="60" width={SCREEN_W - 96} height="148" rx="6" fill={C.surface} stroke={C.border} />
      {Array.from({ length: 10 }).map((_, i) => (
        <rect
          key={i}
          x="62"
          y={80 + i * 12}
          width={120 + (i % 4) * 30}
          height="3"
          rx="1"
          fill={C.ink4}
          opacity="0.4"
        />
      ))}

      {/* Share sheet */}
      <g transform="translate(0, 230)">
        <rect width={SCREEN_W} height={SCREEN_H - 230} rx="0" fill={C.surface} />
        <rect x={SCREEN_W / 2 - 18} y="8" width="36" height="4" rx="2" fill={C.ink4} opacity="0.5" />

        {/* File tile */}
        <g transform="translate(20, 26)">
          <rect width="46" height="58" rx="6" fill={C.surface2} stroke={C.border} />
          {[10, 16, 22, 28, 34, 40, 46, 52].map((y) => (
            <rect key={y} x="6" y={y} width={Math.max(10, 34 - (y % 12))} height="1.5" rx="0.5" fill={C.ink4} opacity="0.6" />
          ))}
          <text
            x="60"
            y="22"
            fontFamily={FONT_SANS}
            fontSize="13"
            fontWeight={600}
            fill={C.ink1}
          >
            Rekeningafschriften-2026-04…
          </text>
          <text
            x="60"
            y="42"
            fontFamily={FONT_SANS}
            fontSize="11"
            fill={C.ink3}
          >
            Pdf-document · 192 KB
          </text>
        </g>

        <line x1="20" y1="106" x2={SCREEN_W - 20} y2="106" stroke={C.border} />

        {/* Row 1: contacts */}
        <g transform="translate(0, 126)">
          {["AB", "CD", "EF", "GH"].map((init, i) => (
            <g key={init} transform={`translate(${36 + i * 80}, 0)`}>
              <circle cx="0" cy="0" r="22" fill={C.surface2} stroke={C.border} />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fontFamily={FONT_SANS}
                fontSize="11"
                fontWeight={600}
                fill={C.ink2}
              >
                {init}
              </text>
              <text
                x="0"
                y="42"
                textAnchor="middle"
                fontFamily={FONT_SANS}
                fontSize="9.5"
                fill={C.ink2}
              >
                {["A.B.", "C.D.", "E.F.", "G.H."][i]}
              </text>
            </g>
          ))}
        </g>

        <line x1="20" y1="194" x2={SCREEN_W - 20} y2="194" stroke={C.border} />

        {/* Row 2: apps */}
        <g transform="translate(0, 214)">
          {[
            { fill: "#3B7CF6", label: "AirDrop" },
            { fill: "#33C065", label: "Berichten" },
            { fill: "#3B89F6", label: "E-mail" },
            { fill: "#1FB152", label: "WA" },
          ].map((b, i) => (
            <g key={b.label} transform={`translate(${36 + i * 80}, 0)`}>
              <rect x="-18" y="-18" width="36" height="36" rx="9" fill={b.fill} opacity="0.85" />
              <text
                x="0"
                y="36"
                textAnchor="middle"
                fontFamily={FONT_SANS}
                fontSize="9.5"
                fill={C.ink2}
              >
                {b.label}
              </text>
            </g>
          ))}
        </g>

        {/* Row 3: actions — "Bewaar in Bestanden" highlighted */}
        <g transform="translate(0, 282)">
          {[
            { label: "Druk af" },
            { label: "Notitie" },
            { label: "Bewaar in Bestanden", highlight: true },
            { label: "HP" },
          ].map((b, i) => (
            <g key={b.label} transform={`translate(${36 + i * 80}, 0)`}>
              {b.highlight && (
                <circle cx="0" cy="0" r="26" fill={C.accentSoft} />
              )}
              <rect
                x="-15"
                y="-15"
                width="30"
                height="30"
                rx="6"
                fill="none"
                stroke={b.highlight ? C.accent : C.ink2}
                strokeWidth="1.5"
              />
              {/* Folder shape only for the Bestanden action */}
              {b.highlight && (
                <path
                  d="M -11 -7 L -4 -7 L -1 -3 L 11 -3 L 11 9 L -11 9 Z"
                  fill="none"
                  stroke={C.accent}
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                  transform="translate(0, 0)"
                />
              )}
              <text
                x="0"
                y="40"
                textAnchor="middle"
                fontFamily={FONT_SANS}
                fontSize="9.5"
                fontWeight={b.highlight ? 600 : 400}
                fill={b.highlight ? C.accent : C.ink2}
              >
                {b.label === "Bewaar in Bestanden" ? "Bewaar in" : b.label}
              </text>
              {b.highlight && (
                <text
                  x="0"
                  y="52"
                  textAnchor="middle"
                  fontFamily={FONT_SANS}
                  fontSize="9.5"
                  fontWeight={600}
                  fill={C.accent}
                >
                  Bestanden
                </text>
              )}
            </g>
          ))}
        </g>
      </g>
    </>
  );
}

/** 9. Files save-as sheet — "Bewaar" top-right highlighted. */
function ScreenSavePicker() {
  return (
    <>
      <StatusBar />

      {/* Top bar */}
      <g transform="translate(0, 60)">
        {/* Back circle */}
        <circle cx="32" cy="20" r="18" fill={C.surface2} />
        <path
          d="M 36 12 L 28 20 L 36 28"
          fill="none"
          stroke={C.ink1}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="64" y="26" fontFamily={FONT_SANS} fontSize="15" fontWeight={600} fill={C.ink1}>
          Downloads
        </text>
        <path
          d="M 144 22 L 150 28 L 156 22"
          fill="none"
          stroke={C.ink2}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots more */}
        <circle cx={SCREEN_W - 92} cy="20" r="3" fill={C.ink2} />
        <circle cx={SCREEN_W - 84} cy="20" r="3" fill={C.ink2} />
        <circle cx={SCREEN_W - 76} cy="20" r="3" fill={C.ink2} />

        {/* Bewaar button — highlighted (filled accent) */}
        <rect x={SCREEN_W - 68} y="2" width="56" height="36" rx="18" fill={C.accent} />
        <text
          x={SCREEN_W - 40}
          y="25"
          textAnchor="middle"
          fontFamily={FONT_SANS}
          fontSize="14"
          fontWeight={600}
          fill={C.surface}
        >
          Bewaar
        </text>
      </g>

      {/* Search bar */}
      <g transform="translate(20, 116)">
        <rect width={SCREEN_W - 40} height="34" rx="17" fill={C.surface2} />
        <circle cx="20" cy="17" r="5" fill="none" stroke={C.ink3} strokeWidth="1.4" />
        <line x1="24" y1="21" x2="28" y2="25" stroke={C.ink3} strokeWidth="1.4" strokeLinecap="round" />
        <text x="38" y="22" fontFamily={FONT_SANS} fontSize="13" fill={C.ink3}>
          Zoeken
        </text>
      </g>

      {/* File grid */}
      <g transform="translate(20, 174)">
        {Array.from({ length: 9 }).map((_, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          return (
            <g key={i} transform={`translate(${col * 110}, ${row * 130})`}>
              <rect width="100" height="86" rx="6" fill={C.surface2} stroke={C.border} />
              {Array.from({ length: 8 }).map((__, k) => (
                <rect
                  key={k}
                  x="10"
                  y={10 + k * 9}
                  width={50 + ((k + i) % 4) * 10}
                  height="2"
                  rx="1"
                  fill={C.ink4}
                  opacity="0.5"
                />
              ))}
              <rect x="10" y="98" width={50 + (i % 3) * 10} height="6" rx="2" fill={C.ink3} opacity="0.7" />
              <rect x="10" y="110" width="32" height="4" rx="1.5" fill={C.ink4} opacity="0.6" />
            </g>
          );
        })}
      </g>

      {/* Bottom "Bewaar als" preview */}
      <g transform={`translate(20, ${SCREEN_H - 80})`}>
        <rect width={SCREEN_W - 40} height="56" rx="14" fill={C.surface2} stroke={C.border} />
        <rect x="10" y="10" width="28" height="36" rx="4" fill={C.surface} stroke={C.border} />
        <text x="46" y="26" fontFamily={FONT_SANS} fontSize="11" fill={C.ink3}>
          Bewaar als
        </text>
        <text x="46" y="42" fontFamily={FONT_SANS} fontSize="12.5" fontWeight={500} fill={C.ink1}>
          Rekeningafschriften-202…
        </text>
      </g>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step manifest                                                             */
/* -------------------------------------------------------------------------- */

type Step = {
  id: string;
  caption: string;
  render: () => React.ReactElement;
  /** Tap location, in screen SVG viewBox coordinates. */
  tap?: { x: number; y: number };
};

const STEPS: ReadonlyArray<Step> = [
  {
    id: "login",
    caption: "Open de Rabobank-app en log in",
    render: ScreenLogin,
    tap: { x: SCREEN_W / 2, y: 308 },
  },
  {
    id: "instellingen-tab",
    caption: "Tik rechtsonder op Instellingen",
    render: ScreenOverview,
    tap: { x: (SCREEN_W / 5) * 4 + SCREEN_W / 10, y: SCREEN_H - 64 + 22 },
  },
  {
    id: "documenten",
    caption: "Open Documenten",
    render: ScreenInstellingen,
    tap: { x: SCREEN_W / 2, y: BODY_TOP + 252 },
  },
  {
    id: "rekeningafschriften",
    caption: "Kies Rekeningafschriften",
    render: ScreenDocumenten,
    tap: { x: SCREEN_W / 2, y: BODY_TOP + 216 },
  },
  {
    id: "kies-rekening",
    caption: "Kies je rekening uit het menu",
    render: ScreenDropdown,
    tap: { x: SCREEN_W / 2 - 10, y: BODY_TOP + 122 },
  },
  {
    id: "kies-maand",
    caption: "Kies het afschrift van vorige maand",
    render: ScreenStatementList,
    tap: { x: SCREEN_W / 2, y: BODY_TOP + 238 },
  },
  {
    id: "deel",
    caption: "Tik linksboven op het deel-icoon",
    render: ScreenPdfPreview,
    tap: { x: 36, y: 72 },
  },
  {
    id: "bewaar-bestanden",
    caption: "Kies Bewaar in Bestanden",
    render: ScreenShareSheet,
    tap: { x: 36 + 2 * 80, y: 230 + 282 },
  },
  {
    id: "bewaar",
    caption: "Tik rechtsboven op Bewaar",
    render: ScreenSavePicker,
    tap: { x: SCREEN_W - 40, y: 60 + 20 },
  },
];

const TOTAL = STEPS.length * STEP_DURATION + OUTRO_DURATION;

/* -------------------------------------------------------------------------- */
/*  Keyframe builders                                                         */
/* -------------------------------------------------------------------------- */

/** Show this step for [start, end] with a 0.25 s crossfade on each edge. */
function stepKeyframes(stepIndex: number, total: number): string {
  const start = stepIndex * STEP_DURATION;
  const end = start + STEP_DURATION;
  const fade = 0.25;
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const p = {
    beforeIn: clamp(((start - fade) / total) * 100),
    in: clamp((start / total) * 100),
    holdEnd: clamp(((end - fade) / total) * 100),
    out: clamp((end / total) * 100),
  };
  return `
    0% { opacity: 0; }
    ${p.beforeIn.toFixed(2)}% { opacity: 0; }
    ${p.in.toFixed(2)}% { opacity: 1; }
    ${p.holdEnd.toFixed(2)}% { opacity: 1; }
    ${p.out.toFixed(2)}% { opacity: 0; }
    100% { opacity: 0; }
  `;
}

function outroKeyframes(total: number): string {
  const start = STEPS.length * STEP_DURATION;
  const fade = 0.25;
  const pBefore = ((start - fade) / total) * 100;
  const pIn = (start / total) * 100;
  return `
    0% { opacity: 0; }
    ${pBefore.toFixed(2)}% { opacity: 0; }
    ${pIn.toFixed(2)}% { opacity: 1; }
    99% { opacity: 1; }
    100% { opacity: 0; }
  `;
}

/** Tap-ring pulse: appears mid-step, pulses twice, fades out at step end. */
function tapKeyframes(stepIndex: number, total: number): string {
  const stepStart = stepIndex * STEP_DURATION;
  const start = stepStart + 0.55;
  const peak1 = start + 0.35;
  const dip = start + 0.7;
  const peak2 = start + 1.05;
  const end = stepStart + STEP_DURATION;
  const exit = end + 0.0;
  const toPct = (v: number) => ((v / total) * 100).toFixed(2);
  return `
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.55); }
    ${toPct(stepStart)}% { opacity: 0; transform: translate(-50%, -50%) scale(0.55); }
    ${toPct(start)}% { opacity: 0; transform: translate(-50%, -50%) scale(0.55); }
    ${toPct(peak1)}% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    ${toPct(dip)}% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.12); }
    ${toPct(peak2)}% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    ${toPct(exit - 0.15)}% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.25); }
    ${toPct(exit)}% { opacity: 0; transform: translate(-50%, -50%) scale(1.35); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.55); }
  `;
}

/** Progress-dot fill: each dot stays cream pre-step, navy during/after. */
function dotKeyframes(stepIndex: number, total: number): string {
  const start = stepIndex * STEP_DURATION;
  const end = start + STEP_DURATION;
  const pStart = ((start / total) * 100).toFixed(2);
  const pStart2 = (((start + 0.3) / total) * 100).toFixed(2);
  const pEnd = ((end / total) * 100).toFixed(2);
  const pEndAfter = (((end + 0.4) / total) * 100).toFixed(2);
  return `
    0% { background: var(--rev-dot, #d8d3c6); width: 18px; }
    ${pStart}% { background: var(--rev-dot, #d8d3c6); width: 18px; }
    ${pStart2}% { background: var(--rev-accent, #1a2a4f); width: 30px; }
    ${pEnd}% { background: var(--rev-accent, #1a2a4f); width: 30px; }
    ${pEndAfter}% { background: var(--rev-accent, #1a2a4f); width: 18px; }
    100% { background: var(--rev-accent, #1a2a4f); width: 18px; }
  `;
}

/** PIN fill animation: each circle fills in sequence during step 1. */
function pinKeyframes(pinIndex: number, total: number): string {
  const fillAt = 0.8 + pinIndex * 0.22; // s into the loop
  const pBefore = ((Math.max(0, fillAt - 0.05) / total) * 100).toFixed(2);
  const pIn = ((fillAt / total) * 100).toFixed(2);
  const pHold = ((STEP_DURATION / total) * 100).toFixed(2);
  const pOut = (((STEP_DURATION + 0.15) / total) * 100).toFixed(2);
  return `
    0% { opacity: 0; }
    ${pBefore}% { opacity: 0; }
    ${pIn}% { opacity: 1; }
    ${pHold}% { opacity: 1; }
    ${pOut}% { opacity: 0; }
    100% { opacity: 0; }
  `;
}

function buildAnimationsCSS(): string {
  const blocks: string[] = [];
  STEPS.forEach((_, i) => {
    blocks.push(`@keyframes rev-step-${i} { ${stepKeyframes(i, TOTAL)} }`);
    blocks.push(`@keyframes rev-cap-${i} { ${stepKeyframes(i, TOTAL)} }`);
    blocks.push(`@keyframes rev-tap-${i} { ${tapKeyframes(i, TOTAL)} }`);
    blocks.push(`@keyframes rev-dot-${i} { ${dotKeyframes(i, TOTAL)} }`);
    blocks.push(`@keyframes rev-num-${i} { ${stepKeyframes(i, TOTAL)} }`);
  });
  for (let k = 0; k < 5; k++) {
    blocks.push(`@keyframes rev-pin-${k} { ${pinKeyframes(k, TOTAL)} }`);
  }
  blocks.push(`@keyframes rev-outro { ${outroKeyframes(TOTAL)} }`);
  return blocks.join("\n");
}

/* -------------------------------------------------------------------------- */
/*  Component pieces                                                          */
/* -------------------------------------------------------------------------- */

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rev-phone">
      <div className="rev-phone__bezel">
        <div className="rev-phone__screen">
          {children}
          <div className="rev-phone__notch" />
        </div>
      </div>
      <span className="rev-phone__btn rev-phone__btn--mute" />
      <span className="rev-phone__btn rev-phone__btn--vol-up" />
      <span className="rev-phone__btn rev-phone__btn--vol-dn" />
      <span className="rev-phone__btn rev-phone__btn--pwr" />
    </div>
  );
}

function TapRing({ x, y, animationName }: { x: number; y: number; animationName: string }) {
  const leftPct = (x / SCREEN_W) * 100;
  const topPct = (y / SCREEN_H) * 100;
  return (
    <span
      className="rev-tap"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        animation: `${animationName} ${TOTAL}s linear infinite`,
      }}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="#1a2a4f" opacity="0.1" />
        <circle cx="60" cy="60" r="40" fill="#1a2a4f" opacity="0.18" />
        <circle cx="60" cy="60" r="28" fill="#1a2a4f" opacity="0.32" />
        <circle cx="60" cy="60" r="14" fill="#1a2a4f" />
      </svg>
    </span>
  );
}

function BrandMark() {
  return (
    <span className="rev-mark" aria-hidden="true">
      <span className="rev-mark__pi">π</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Root                                                                      */
/* -------------------------------------------------------------------------- */

const KEYFRAMES_CSS = buildAnimationsCSS();

const RabobankExportVisual: React.FC = () => {
  return (
    <div
      className="rev-root"
      role="img"
      aria-label="Animatie: hoe je je Rabobank-rekeningafschrift downloadt en opslaat op je telefoon."
    >
      <style>{INLINE_CSS}</style>
      <style>{KEYFRAMES_CSS}</style>

      <div className="rev-stage">
        {/* Step counter + caption row */}
        <div className="rev-caption-wrap">
          <div className="rev-stepcount" aria-hidden="true">
            <span className="rev-stepcount__nums">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className="rev-stepcount__num"
                  style={{ animation: `rev-num-${i} ${TOTAL}s linear infinite` }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              ))}
              <span
                className="rev-stepcount__num"
                style={{ animation: `rev-outro ${TOTAL}s linear infinite` }}
              >
                09
              </span>
            </span>
            <span className="rev-stepcount__sep">→</span>
            <span>09</span>
            <span className="rev-stepcount__sep rev-stepcount__sep--mid">·</span>
            <span>stap voor stap</span>
          </div>

          <div className="rev-caption">
            {STEPS.map((s, i) => (
              <p
                key={s.id}
                className="rev-caption__line"
                style={{ animation: `rev-cap-${i} ${TOTAL}s linear infinite` }}
              >
                {s.caption}
              </p>
            ))}
            <p
              className="rev-caption__line rev-caption__line--outro"
              style={{ animation: `rev-outro ${TOTAL}s linear infinite` }}
            >
              Klaar.
            </p>
          </div>
        </div>

        {/* Phone */}
        <PhoneFrame>
          {STEPS.map((s, i) => {
            const Screen = s.render;
            return (
              <div
                key={s.id}
                className="rev-screen"
                style={{ animation: `rev-step-${i} ${TOTAL}s linear infinite` }}
              >
                <svg
                  viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`}
                  preserveAspectRatio="xMidYMid meet"
                  width="100%"
                  height="100%"
                  aria-hidden="true"
                >
                  <Screen />
                </svg>
                {s.tap && <TapRing x={s.tap.x} y={s.tap.y} animationName={`rev-tap-${i}`} />}
              </div>
            );
          })}

          {/* Outro */}
          <div
            className="rev-outro"
            style={{ animation: `rev-outro ${TOTAL}s linear infinite` }}
          >
            <BrandMark />
            <p className="rev-outro__head">Klaar.</p>
            <p className="rev-outro__sub">
              Upload je PDF op <em>mijnpersoonlijkeinflatie.nl</em>
              <br />en bereken je <em>persoonlijke</em> inflatie.
            </p>
            <p className="rev-outro__meta">2 minuten · gratis · geen account</p>
          </div>
        </PhoneFrame>

        {/* Progress dots */}
        <div className="rev-progress" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className="rev-progress__dot"
              style={{ animation: `rev-dot-${i} ${TOTAL}s linear infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Stylesheet                                                                */
/* -------------------------------------------------------------------------- */

const INLINE_CSS = `
.rev-root {
  --rev-bg: var(--bg, #f7f6f3);
  --rev-surface: var(--surface, #ffffff);
  --rev-surface-2: var(--surface-2, #f1efe9);
  --rev-ink-1: var(--ink-1, #14161a);
  --rev-ink-2: var(--ink-2, #3c3f47);
  --rev-ink-3: var(--ink-3, #6b6f78);
  --rev-accent: var(--accent, #1a2a4f);
  --rev-accent-soft: var(--accent-soft, #e6e9f1);
  --rev-border: var(--border, #e3dfd5);
  --rev-dot: #d8d3c6;

  font-family: var(--font-sans, ${FONT_SANS});
  color: var(--rev-ink-1);
  background: var(--rev-bg);
  position: relative;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  aspect-ratio: 9 / 16;
  display: block;
  overflow: hidden;
  border-radius: var(--d-radius-lg, 16px);
  border: 1px solid var(--rev-border);
}

.rev-stage {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
  padding: clamp(14px, 4.5%, 22px) clamp(14px, 5%, 24px);
  gap: clamp(8px, 2%, 14px);
}

/* Caption block */
.rev-caption-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: clamp(56px, 13%, 84px);
}
.rev-stepcount {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono, ${FONT_MONO});
  font-size: clamp(10px, 2.6vw, 12px);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--rev-ink-3);
}
.rev-stepcount__nums {
  position: relative;
  display: inline-block;
  min-width: 2.2ch;
  height: 1em;
}
.rev-stepcount__num {
  position: absolute;
  inset: 0;
  opacity: 0;
  color: var(--rev-accent);
}
.rev-stepcount__sep { color: var(--rev-ink-3); }
.rev-stepcount__sep--mid { margin: 0 2px; }

.rev-caption {
  position: relative;
  display: block;
  min-height: clamp(48px, 11%, 72px);
}
.rev-caption__line {
  position: absolute;
  inset: 0;
  margin: 0;
  font-family: var(--font-serif, ${FONT_SERIF});
  font-weight: 500;
  font-size: clamp(18px, 4.7vw, 25px);
  line-height: 1.18;
  letter-spacing: -0.015em;
  color: var(--rev-ink-1);
  opacity: 0;
  text-wrap: balance;
}
.rev-caption__line em { font-style: italic; color: var(--rev-accent); }
.rev-caption__line--outro { color: var(--rev-ink-2); }

/* Phone */
.rev-phone {
  position: relative;
  margin: 0 auto;
  aspect-ratio: 9 / 19.5;
  height: 100%;
  width: auto;
  max-width: 100%;
  max-height: 100%;
}
.rev-phone__bezel {
  position: absolute;
  inset: 0;
  background: #1c1e22;
  border-radius: 13.5% / 6.3%;
  padding: 3.2% 3.4%;
  box-shadow:
    inset 0 0 0 1px #2a2d33,
    inset 0 0 0 3px #0e1013,
    0 12px 28px -10px rgba(20,22,26,0.35);
}
.rev-phone__screen {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--rev-surface);
  border-radius: 10.5% / 5.2%;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.4);
}
.rev-phone__notch {
  position: absolute;
  top: 1.6%;
  left: 50%;
  transform: translateX(-50%);
  width: 32%;
  height: 3.6%;
  background: #0a0c0f;
  border-radius: 999px;
  z-index: 6;
  pointer-events: none;
}
.rev-phone__btn { position: absolute; background: #1c1e22; border-radius: 2px; }
.rev-phone__btn--mute  { left: -2px; top: 17%; width: 3px; height: 4%; }
.rev-phone__btn--vol-up{ left: -2px; top: 24%; width: 3px; height: 7%; }
.rev-phone__btn--vol-dn{ left: -2px; top: 33%; width: 3px; height: 7%; }
.rev-phone__btn--pwr   { right: -2px; top: 25%; width: 3px; height: 9%; }

/* Screens */
.rev-screen {
  position: absolute;
  inset: 0;
  opacity: 0;
  will-change: opacity;
}
.rev-screen svg { display: block; width: 100%; height: 100%; }

/* PIN sequential fill (only used by ScreenLogin) */
.rev-pin { opacity: 0; }
.rev-pin--0 { animation: rev-pin-0 var(--rev-total, ${TOTAL}s) linear infinite; }
.rev-pin--1 { animation: rev-pin-1 var(--rev-total, ${TOTAL}s) linear infinite; }
.rev-pin--2 { animation: rev-pin-2 var(--rev-total, ${TOTAL}s) linear infinite; }
.rev-pin--3 { animation: rev-pin-3 var(--rev-total, ${TOTAL}s) linear infinite; }
.rev-pin--4 { animation: rev-pin-4 var(--rev-total, ${TOTAL}s) linear infinite; }

/* Tap ring */
.rev-tap {
  position: absolute;
  width: 12%;
  aspect-ratio: 1;
  pointer-events: none;
  opacity: 0;
  z-index: 5;
  transform: translate(-50%, -50%) scale(0.55);
  will-change: transform, opacity;
}
.rev-tap svg { width: 100%; height: 100%; display: block; }

/* Outro */
.rev-outro {
  position: absolute;
  inset: 0;
  z-index: 7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
  padding: 14% 9%;
  background: var(--rev-bg);
  opacity: 0;
}
.rev-outro__head {
  margin: 0;
  font-family: var(--font-serif, ${FONT_SERIF});
  font-weight: 500;
  font-style: italic;
  font-size: clamp(40px, 12vw, 58px);
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--rev-ink-1);
}
.rev-outro__sub {
  margin: 0;
  font-family: var(--font-sans, ${FONT_SANS});
  font-size: clamp(13px, 3.5vw, 17px);
  line-height: 1.4;
  color: var(--rev-ink-2);
  max-width: 26ch;
  text-wrap: balance;
}
.rev-outro__sub em {
  font-style: italic;
  font-family: var(--font-serif, ${FONT_SERIF});
  font-weight: 500;
  color: var(--rev-accent);
}
.rev-outro__meta {
  margin: 0;
  font-family: var(--font-mono, ${FONT_MONO});
  font-size: clamp(10px, 2.6vw, 12px);
  letter-spacing: 0.06em;
  color: var(--rev-ink-3);
  text-transform: lowercase;
}
.rev-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: clamp(36px, 9%, 48px);
  aspect-ratio: 1;
  border-radius: 22%;
  background: var(--rev-accent);
  color: #fff;
  margin-bottom: 4px;
}
.rev-mark__pi {
  font-family: var(--font-serif, ${FONT_SERIF});
  font-style: italic;
  font-weight: 500;
  font-size: clamp(22px, 6vw, 30px);
  line-height: 1;
  transform: translateY(-2px);
}

/* Progress */
.rev-progress {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  height: 12px;
}
.rev-progress__dot {
  display: block;
  width: 18px;
  height: 4px;
  border-radius: 4px;
  background: var(--rev-dot);
  will-change: background, width;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .rev-screen, .rev-caption__line, .rev-stepcount__num,
  .rev-progress__dot, .rev-outro, .rev-tap, .rev-pin {
    animation-duration: 0.001s !important;
    animation-iteration-count: 1 !important;
  }
}
`;

export default RabobankExportVisual;
