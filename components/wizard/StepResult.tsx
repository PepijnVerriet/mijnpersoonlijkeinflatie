"use client";

import type { ProcessResult } from "@/lib/wizard/types";

interface StepResultProps {
  result: ProcessResult;
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

export function StepResult({ result, onBack, onReset }: StepResultProps) {
  const totalSpending = result.transactions.reduce((s, t) => s + t.amount, 0);
  const coveredSpending = result.transactions
    .filter((t) => t.category !== null)
    .reduce((s, t) => s + t.amount, 0);

  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold text-gray-900">
        Resultaat-scherm komt binnenkort
      </h2>
      <p className="mb-6 text-sm text-gray-700">
        Hier komen straks je persoonlijke inflatiecijfer, een visualisatie van
        je bestedingsmandje, en breakdown per categorie. (Module 4e-1c)
      </p>

      <div className="mb-6 rounded border border-gray-200 bg-white p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Backend status
        </h3>
        <ul className="space-y-1 text-sm text-gray-800">
          <li>
            <span className="font-medium">{result.transactionCount}</span>{" "}
            transacties verwerkt
          </li>
          <li>
            <span className="font-medium">{result.categorizedCount}</span>{" "}
            gecategoriseerd door keyword + AI + correcties
          </li>
          <li>
            <span className="font-medium">
              {fmtAmount(coveredSpending)}
            </span>{" "}
            gedekt van totaal <span>{fmtAmount(totalSpending)}</span> aan
            uitgaven
          </li>
        </ul>
        <p className="mt-2 text-xs text-gray-500">
          Deze cijfers fungeren als sanity-check tijdens de ontwikkeling. De
          inflatieberekening uit module 4d wordt in 4e-1c hier zichtbaar
          gemaakt.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Terug naar correcties
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
        >
          Opnieuw beginnen
        </button>
      </div>
    </section>
  );
}
