"use client";

import type { InflationCalculation } from "@/lib/inflation/types";
import type { InflationMeta, ProcessResult } from "@/lib/wizard/types";
import { InflationBreakdownTable } from "./InflationBreakdownTable";
import { InflationChart } from "./InflationChart";
import { Spinner } from "./Spinner";

/** Hard-coded headline reference rate while CBS API is unreachable. */
const REFERENCE_INFLATION = 3.5;

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

function fmtPct(n: number, digits = 2): string {
  return `${n.toFixed(digits)}%`;
}

function fmtMonth(ym: string): string {
  const [yr, mo] = ym.split("-");
  const idx = Number(mo) - 1;
  return `${NL_MONTHS[idx] ?? mo} ${yr}`;
}

function fmtPeriod(months: readonly string[]): string {
  if (months.length === 0) return "—";
  if (months.length === 1) return `over ${fmtMonth(months[0])}`;
  return `over ${fmtMonth(months[0])} t/m ${fmtMonth(months[months.length - 1])}`;
}

function compareLabel(personal: number, reference: number): string {
  const diff = personal - reference;
  if (Math.abs(diff) < 0.3) return "vergelijkbaar met";
  return diff > 0 ? "hoger dan" : "lager dan";
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
      <section>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Berekening loopt…
        </h2>
        <Spinner label="Je persoonlijke inflatie wordt uitgerekend." />
      </section>
    );
  }

  if (!calculation || !meta) {
    return (
      <section>
        <p className="text-sm text-gray-600">
          Nog geen berekening beschikbaar. Ga terug naar de correctie-stap.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Terug naar correctie
        </button>
      </section>
    );
  }

  const inflationSign = calculation.totalInflation >= 0 ? "" : "−";
  const inflationDisplay = `${inflationSign}${Math.abs(calculation.totalInflation).toFixed(2)}%`;

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

  return (
    <section className="space-y-8">
      {/* (a) Hero */}
      <div>
        <p className="text-sm uppercase tracking-wide text-gray-500">
          Jouw persoonlijke inflatie
        </p>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-5xl font-semibold text-gray-900 sm:text-6xl">
            {inflationDisplay}
          </span>
          {meta.usingMockData && (
            <span
              title="Officiële CBS-data is tijdelijk niet beschikbaar. Cijfers gebaseerd op plausibele mock-waardes."
              className="cursor-help text-xs text-gray-500"
            >
              demo waardes
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-600">
          {fmtPeriod(calculation.monthsIncluded)}
        </p>
      </div>

      {/* (b) Comparison */}
      <p className="text-sm text-gray-700">
        Het Nederlandse referentiecijfer is{" "}
        <strong>{fmtPct(REFERENCE_INFLATION)}</strong>. Jouw inflatie is{" "}
        <strong>
          {compareLabel(calculation.totalInflation, REFERENCE_INFLATION)}
        </strong>{" "}
        het gemiddelde.
        {meta.usingMockData && (
          <span className="ml-1 text-xs text-gray-500">
            (referentie is tijdelijk gehardcoded zolang CBS-API offline is)
          </span>
        )}
      </p>

      {/* (c) Chart */}
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Bijdrage per categorie
        </h3>
        <InflationChart breakdown={calculation.breakdown} />
      </div>

      {/* (d) Breakdown */}
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Breakdown per categorie
        </h3>
        <InflationBreakdownTable
          breakdown={calculation.breakdown}
          totalInflation={calculation.totalInflation}
        />
      </div>

      {/* (e) Transparency */}
      <div className="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Over deze berekening
        </h3>
        <p className="leading-relaxed">
          We hebben <strong>{categorisedCount}</strong> van je{" "}
          <strong>{totalTransactions}</strong> transacties (
          <strong>{fmtPct(countPct, 1)}</strong>) kunnen categoriseren. In
          euro&apos;s dekken we{" "}
          <strong>{fmtAmount(categorisedSpending)}</strong> van je{" "}
          <strong>{fmtAmount(grossSpending)}</strong> (
          <strong>{fmtPct(euroPct, 1)}</strong>) totale uitgaven.
        </p>
        {unknownCount > 0 && (
          <p className="mt-2 leading-relaxed">
            De resterende <strong>{unknownCount}</strong>{" "}
            {unknownCount === 1 ? "transactie" : "transacties"} (
            <strong>{fmtAmount(uncategorisedSpending)}</strong> aan uitgaven)
            zijn niet meegenomen.
          </p>
        )}
        {calculation.categoriesWithoutCbsData.length > 0 && (
          <p className="mt-2 leading-relaxed">
            Daarnaast hadden{" "}
            <strong>{calculation.categoriesWithoutCbsData.length}</strong>{" "}
            categorieën geen CBS-data voor de geüploade maanden; deze tellen
            niet mee in het inflatiecijfer maar wel in het uitgaventotaal.
          </p>
        )}
      </div>

      {/* (f) Footer */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Opnieuw beginnen
        </button>
        <button
          type="button"
          onClick={() =>
            alert(
              "Delen van je persoonlijke inflatie komt in een volgende sessie (module 4e-2).",
            )
          }
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Deel je inflatie
        </button>
      </div>
    </section>
  );
}
