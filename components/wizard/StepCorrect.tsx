"use client";

import { CATEGORIES } from "@/lib/cbs/categories";
import type { CategoryCode } from "@/lib/cbs/types";
import type { ProcessResult, ProcessTransaction } from "@/lib/wizard/types";
import { Spinner } from "./Spinner";

interface StepCorrectProps {
  result: ProcessResult;
  suggestionsLoading: boolean;
  suggestionsFallback: boolean;
  userCategories: Record<string, CategoryCode>;
  submitting: boolean;
  onChange: (id: string, category: CategoryCode) => void;
  onBack: () => void;
  onSubmit: () => void;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}

function fmtAmount(n: number): string {
  return n.toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

function unknownTransactions(result: ProcessResult): ProcessTransaction[] {
  return result.transactions.filter((t) => t.category === null);
}

export function StepCorrect({
  result,
  suggestionsLoading,
  suggestionsFallback,
  userCategories,
  submitting,
  onChange,
  onBack,
  onSubmit,
}: StepCorrectProps) {
  const unknowns = unknownTransactions(result);
  const unknownSpending = unknowns.reduce((s, t) => s + t.amount, 0);
  const totalSpending = result.transactions.reduce((s, t) => s + t.amount, 0);
  const sharePct = totalSpending > 0 ? (unknownSpending / totalSpending) * 100 : 0;

  if (unknowns.length === 0) {
    return (
      <section>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Geen correcties nodig
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          Alle {result.transactionCount} transacties zijn al gecategoriseerd.
        </p>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Terug
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Verder naar resultaat
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold text-gray-900">
        Controleer en corrigeer onbekende transacties
      </h2>
      <p className="mb-1 text-sm text-gray-700">
        {unknowns.length} transacties wachten op categorisatie (
        {fmtAmount(unknownSpending)}, {sharePct.toFixed(1)}% van je uitgaven).
      </p>
      <p className="mb-4 text-sm text-gray-600">
        We hebben per transactie een suggestie gedaan. Controleer en pas aan
        waar nodig.
      </p>

      {suggestionsLoading && (
        <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3">
          <Spinner
            label={`AI doet suggesties voor ${unknowns.length} transacties…`}
          />
        </div>
      )}

      {suggestionsFallback && !suggestionsLoading && (
        <div
          role="status"
          className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
        >
          AI-suggesties zijn niet beschikbaar. De dropdowns staan standaard op{" "}
          <strong>12 Diversen</strong>; pas elke transactie handmatig aan.
        </div>
      )}

      <div className="mb-6 overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th scope="col" className="px-3 py-2 text-left">Datum</th>
              <th scope="col" className="px-3 py-2 text-right">Bedrag</th>
              <th scope="col" className="px-3 py-2 text-left">Omschrijving</th>
              <th scope="col" className="px-3 py-2 text-left">Categorie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {unknowns.map((t) => {
              const chosen = userCategories[t.id] ?? "12";
              const label = t.merchant ?? t.description.slice(0, 80);
              return (
                <tr key={t.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                    {fmtDate(t.date)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right text-gray-900">
                    {fmtAmount(t.amount)}
                  </td>
                  <td
                    className="max-w-[20rem] truncate px-3 py-2 text-gray-700"
                    title={t.description}
                  >
                    {label}
                  </td>
                  <td className="px-3 py-2">
                    <label className="sr-only" htmlFor={`cat-${t.id}`}>
                      Categorie voor {label}
                    </label>
                    <select
                      id={`cat-${t.id}`}
                      value={chosen}
                      disabled={suggestionsLoading || submitting}
                      onChange={(e) =>
                        onChange(t.id, e.target.value as CategoryCode)
                      }
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} {c.shortName}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Terug
        </button>
        <div className="flex items-center gap-3">
          {submitting && <Spinner label="Opslaan…" />}
          <button
            type="button"
            onClick={onSubmit}
            disabled={suggestionsLoading || submitting}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            Verder naar resultaat
          </button>
        </div>
      </div>
    </section>
  );
}
