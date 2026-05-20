"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/ui/Footer";
import { ArrowIcon, RefreshIcon, ShareIcon } from "@/components/ui/icons";
import { getCategory } from "@/lib/cbs/categories";
import type { InflationCalculation } from "@/lib/inflation/types";
import type { InflationMeta, ProcessResult } from "@/lib/wizard/types";
import { BreakdownBars } from "./result/BreakdownBars";
import { BreakdownTable } from "./result/BreakdownTable";
import { CbsFallbackBanner } from "./result/CbsFallbackBanner";
import { ComparisonBars } from "./result/ComparisonBars";
import { HeroNumber } from "./result/HeroNumber";
import { Spinner } from "./Spinner";

const NL_MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

interface StepResultProps {
  result: ProcessResult;
  calculation: InflationCalculation | null;
  meta: InflationMeta | null;
  calculating: boolean;
  onBack: () => void;
  onReset: () => void;
}

function fmtAmount(n: number): string {
  return n.toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

function fmtMonth(ym: string): string {
  const [yr, mo] = ym.split("-");
  const idx = Number(mo) - 1;
  return `${NL_MONTHS[idx] ?? mo} ${yr}`;
}

function fmtPeriodHeader(months: readonly string[]): string {
  if (months.length === 0) return "—";
  if (months.length === 1) return `over ${fmtMonth(months[0])}`;
  return `over ${fmtMonth(months[0])} t/m ${fmtMonth(months[months.length - 1])}`;
}

function compareLabel(personal: number, reference: number): "boven" | "onder" | "vergelijkbaar met" {
  const diff = personal - reference;
  if (Math.abs(diff) < 0.3) return "vergelijkbaar met";
  return diff > 0 ? "boven" : "onder";
}

export function StepResult({
  result,
  calculation,
  meta,
  calculating,
  onBack,
  onReset,
}: StepResultProps) {
  if (calculating) {
    return (
      <section className="mx-auto max-w-[720px] px-[22px] py-16 text-center md:py-24">
        <h2 className="m-0 mb-6 font-serif text-[24px] font-medium tracking-[-0.02em] text-ink-1 md:text-[28px]">
          Berekening loopt…
        </h2>
        <div className="flex justify-center">
          <Spinner label="Je persoonlijke inflatie wordt uitgerekend." />
        </div>
      </section>
    );
  }

  if (!calculation || !meta) {
    return (
      <section className="mx-auto max-w-[720px] px-[22px] py-16 md:py-24">
        <p className="m-0 mb-6 text-sm text-ink-2">
          Nog geen berekening beschikbaar. Ga terug naar de correctie-stap.
        </p>
        <Button variant="secondary" onClick={onBack}>
          <ArrowIcon size={14} dir="left" /> Terug naar correctie
        </Button>
      </section>
    );
  }

  const totalTransactions = result.transactionCount;
  const categorisedCount = result.transactions.filter(
    (t) => t.category !== null,
  ).length;
  const unknownCount = totalTransactions - categorisedCount;
  const categorisedSpending = result.transactions
    .filter((t) => t.category !== null)
    .reduce((s, t) => s + t.amount, 0);
  const uncategorisedSpending = result.transactions
    .filter((t) => t.category === null)
    .reduce((s, t) => s + t.amount, 0);
  const grossSpending = categorisedSpending + uncategorisedSpending;
  const countPct =
    totalTransactions > 0 ? (categorisedCount / totalTransactions) * 100 : 0;
  const euroPct =
    grossSpending > 0 ? (categorisedSpending / grossSpending) * 100 : 0;

  const personal = calculation.totalInflation;
  const reference = calculation.referenceInflation;
  const hasReference = typeof reference === "number";
  const diff = hasReference ? personal - reference : 0;
  const compare = hasReference ? compareLabel(personal, reference) : null;
  const periodMonths = calculation.monthsIncluded;
  const periodLabel =
    periodMonths.length === 0
      ? "deze periode"
      : periodMonths.length === 1
        ? fmtMonth(periodMonths[0])
        : `${fmtMonth(periodMonths[0])} t/m ${fmtMonth(periodMonths[periodMonths.length - 1])}`;
  const top = [...calculation.breakdown]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .filter((b) => Math.abs(b.weight) > 0.001);
  const top1 = top[0] ? getCategory(top[0].category).shortName.toLowerCase() : null;
  const top2 = top[1] ? getCategory(top[1].category).shortName.toLowerCase() : null;

  return (
    <>
      {/* =============== HERO =============== */}
      <section className="mx-auto max-w-[1180px] px-[22px] pb-7 pt-9 md:px-12 md:pb-12 md:pt-[72px]">
        <div className="mb-6 flex flex-wrap items-center gap-2.5">
          <span className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
            Jouw persoonlijke inflatie
          </span>
          <span className="text-ink-4">·</span>
          <span className="font-mono text-[12px] text-ink-3">
            {fmtPeriodHeader(periodMonths)}
          </span>
          {meta.usingMockData && (
            <Badge tone="warn">
              <span
                title="Officiële CBS-data is tijdelijk niet beschikbaar. Cijfers gebaseerd op plausibele mock-waardes."
              >
                demo waardes
              </span>
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 items-end gap-7 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-16">
          <div>
            <HeroNumber target={personal} />
            <p className="mt-5 max-w-[560px] font-serif text-[18px] italic leading-[1.45] text-ink-2 text-balance md:text-[22px]">
              Jouw uitgaven werden{" "}
              {periodMonths.length === 1 ? `in ${fmtMonth(periodMonths[0])}` : "in deze periode"}{" "}
              <strong className="font-medium not-italic">
                {Math.abs(personal).toLocaleString("nl-NL", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                {" "}%{" "}
              </strong>
              {personal >= 0 ? "duurder" : "goedkoper"}.{" "}
              {hasReference && compare === "vergelijkbaar met" && (
                <>Dat is vergelijkbaar met het Nederlandse gemiddelde.</>
              )}
              {hasReference && compare !== "vergelijkbaar met" && (
                <>
                  Dat is{" "}
                  {Math.abs(diff).toLocaleString("nl-NL", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  procentpunt {compare} het Nederlandse gemiddelde.
                </>
              )}
            </p>
          </div>

          {/* Comparison panel — only renders when we have a CBS headline. */}
          {hasReference && (
            <div className="rounded-token border border-border bg-surface p-[22px] md:p-7">
              <div className="mb-[18px] text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-3">
                Vergeleken met Nederland
              </div>
              <ComparisonBars personal={personal} reference={reference} />
              <div className="mt-[18px] border-t border-border pt-4 text-[13px] leading-[1.55] text-ink-2">
                {compare === "vergelijkbaar met" ? (
                  <>Jouw inflatie ligt dicht bij het CBS-gemiddelde.</>
                ) : (
                  <>
                    Je hebt een{" "}
                    <strong
                      className={
                        compare === "boven" ? "text-neg" : "text-pos"
                      }
                    >
                      {compare === "boven" ? "hogere" : "lagere"}
                    </strong>{" "}
                    inflatie dan het gemiddelde
                    {top1 && (
                      <>
                        , vooral door je aandeel in <strong>{top1}</strong>
                        {top2 ? (
                          <>
                            {" "}en <strong>{top2}</strong>
                          </>
                        ) : null}
                      </>
                    )}
                    .
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {meta.usingMockData && <CbsFallbackBanner />}

      {/* =============== BREAKDOWN BARS =============== */}
      <section className="mx-auto max-w-[1180px] px-[22px] pb-2 pt-4 md:px-12 md:pb-6 md:pt-8">
        <div className="mb-[18px] flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="m-0 mb-1 font-serif text-[22px] font-medium tracking-[-0.015em] md:text-[28px]">
              Wat duwt jouw cijfer omhoog
            </h2>
            <p className="m-0 text-[13.5px] text-ink-3">
              Top {Math.min(top.length, 8)} categorieën gesorteerd op bijdrage.
            </p>
          </div>
          <div className="font-mono text-[11.5px] tracking-[0.04em] text-ink-4">
            BIJDRAGE in procentpunten
          </div>
        </div>
        <div className="rounded-token border border-border bg-surface p-3 md:p-[18px]">
          <BreakdownBars breakdown={calculation.breakdown} />
        </div>
      </section>

      {/* =============== FULL TABLE =============== */}
      <section className="mx-auto max-w-[1180px] px-[22px] py-5 md:px-12 md:py-8">
        <div className="mb-[18px] flex flex-wrap items-end justify-between gap-2">
          <h2 className="m-0 font-serif text-[22px] font-medium tracking-[-0.015em] md:text-[28px]">
            Volledige breakdown
          </h2>
        </div>
        <BreakdownTable
          breakdown={calculation.breakdown}
          totalInflation={personal}
        />
      </section>

      {/* =============== TRANSPARENCY =============== */}
      <section className="mx-auto max-w-[1180px] px-[22px] pb-4 pt-2 md:px-12 md:pb-8">
        <div className="rounded-token border border-border bg-surface-2 p-6 md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
              Over deze berekening
            </span>
          </div>
          <div className="mb-[22px] grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            <div>
              <div className="font-serif text-[22px] font-medium tabular-nums tracking-[-0.02em] text-ink-1">
                {totalTransactions}
              </div>
              <div className="mt-1 text-[12px] text-ink-3">
                Transacties verwerkt
              </div>
            </div>
            <div>
              <div className="font-serif text-[22px] font-medium tabular-nums tracking-[-0.02em] text-ink-1">
                {euroPct.toFixed(1)} %
              </div>
              <div className="mt-1 text-[12px] text-ink-3">
                Dekking in euro&apos;s ({countPct.toFixed(0)} % van transacties)
              </div>
            </div>
            <div>
              <div className="font-serif text-[22px] font-medium tabular-nums tracking-[-0.02em] text-ink-1">
                {calculation.categoriesUsed} / 13
              </div>
              <div className="mt-1 text-[12px] text-ink-3">
                CBS-categorieën gevuld
              </div>
            </div>
            <div>
              <div className="font-serif text-[22px] font-medium tabular-nums tracking-[-0.02em] text-ink-1">
                {periodMonths.length}{" "}
                {periodMonths.length === 1 ? "maand" : "maanden"}
              </div>
              <div className="mt-1 text-[12px] text-ink-3">
                {periodMonths.length > 0
                  ? `${fmtMonth(periodMonths[0])}${
                      periodMonths.length > 1
                        ? ` t/m ${fmtMonth(periodMonths[periodMonths.length - 1])}`
                        : ""
                    }`
                  : "geen data"}
              </div>
            </div>
          </div>
          <div className="max-w-[800px] space-y-2 text-[13px] leading-[1.65] text-ink-2">
            <p className="m-0">
              We hebben <strong>{categorisedCount}</strong> van je{" "}
              <strong>{totalTransactions}</strong> transacties (
              <strong>{fmtAmount(categorisedSpending)}</strong> van{" "}
              <strong>{fmtAmount(grossSpending)}</strong>) gebruikt voor het
              cijfer.
              {unknownCount > 0 && (
                <>
                  {" "}De resterende <strong>{unknownCount}</strong>{" "}
                  {unknownCount === 1 ? "transactie" : "transacties"} (
                  <strong>{fmtAmount(uncategorisedSpending)}</strong>) zijn niet
                  meegerekend.
                </>
              )}
            </p>
            {meta.excludedCount > 0 && (
              <p className="m-0">
                Je hebt zelf{" "}
                <strong>
                  {meta.excludedCount}{" "}
                  {meta.excludedCount === 1 ? "transactie" : "transacties"}
                </strong>{" "}
                uitgesloten (<strong>{fmtAmount(meta.excludedAmount)}</strong>).
              </p>
            )}
            {calculation.categoriesWithoutCbsData.length > 0 && (
              <p className="m-0 text-ink-3">
                Daarnaast hadden{" "}
                <strong>{calculation.categoriesWithoutCbsData.length}</strong>{" "}
                categorieën geen CBS-data voor de geüploade maanden; deze tellen
                niet mee in het inflatiecijfer.
              </p>
            )}
            <p className="m-0">
              Dit cijfer geldt voor <strong>{periodLabel}</strong>. Een andere
              upload-periode geeft een andere uitkomst, want de Nederlandse
              inflatie verschilt per maand, en we vergelijken elke maand met
              diezelfde maand een jaar eerder.
            </p>
            <p className="m-0 text-ink-3">
              Dit is een benadering, geen officieel cijfer. Eenmalige aankopen,
              seizoenseffecten en vaste lasten kunnen het beeld vertekenen.
              Upload meer maanden voor een nauwkeurigere schatting.
            </p>
          </div>
        </div>
      </section>

      {/* =============== ACTIONS =============== */}
      <section className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-[22px] py-5 pb-8 md:px-12 md:py-4 md:pb-14">
        <Button variant="secondary" onClick={onReset}>
          <RefreshIcon size={13} /> Opnieuw beginnen
        </Button>
        <Button
          variant="primary"
          onClick={() =>
            alert(
              "Delen van je persoonlijke inflatie komt in een volgende sessie.",
            )
          }
        >
          <ShareIcon size={14} /> Deel je inflatie
        </Button>
      </section>

      <Footer />
    </>
  );
}
