"use client";

import { getCategory } from "@/lib/cbs/categories";
import type { ProcessResult } from "@/lib/wizard/types";

interface StepReviewProps {
  result: ProcessResult;
  onBack: () => void;
  onNext: () => void;
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

function categoryLabel(code: string | null): string {
  if (!code) return "—";
  try {
    const meta = getCategory(code as never);
    return `${code} ${meta.shortName}`;
  } catch {
    return code;
  }
}

export function StepReview({ result, onBack, onNext }: StepReviewProps) {
  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold text-gray-900">
        Controleer je transacties
      </h2>
      <p className="mb-4 text-sm text-gray-600">
        We hebben {result.transactionCount} uitgaven uit je afschrift gehaald.{" "}
        {result.categorizedCount} kregen een categorie toegewezen,{" "}
        {result.unknownCount} bleven onbekend en gaan in de volgende stap naar
        je toe ter correctie.
      </p>

      <div className="mb-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded border border-gray-200 bg-white p-3">
          <div className="text-2xl font-semibold text-gray-900">
            {result.transactionCount}
          </div>
          <div className="text-xs text-gray-500">Transacties</div>
        </div>
        <div className="rounded border border-gray-200 bg-white p-3">
          <div className="text-2xl font-semibold text-blue-700">
            {result.categorizedCount}
          </div>
          <div className="text-xs text-gray-500">Gecategoriseerd</div>
        </div>
        <div className="rounded border border-gray-200 bg-white p-3">
          <div className="text-2xl font-semibold text-amber-700">
            {result.unknownCount}
          </div>
          <div className="text-xs text-gray-500">Onbekend</div>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th scope="col" className="px-3 py-2 text-left">Datum</th>
              <th scope="col" className="px-3 py-2 text-right">Bedrag</th>
              <th scope="col" className="px-3 py-2 text-left">Merchant</th>
              <th scope="col" className="px-3 py-2 text-left">Categorie</th>
              <th scope="col" className="px-3 py-2 text-left">Bron</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {result.transactions.map((t) => (
              <tr key={t.id} className={t.category === null ? "bg-amber-50" : ""}>
                <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                  {fmtDate(t.date)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-gray-900">
                  {fmtAmount(t.amount)}
                </td>
                <td className="max-w-[16rem] truncate px-3 py-2 text-gray-700">
                  {t.merchant ?? t.description.slice(0, 60)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                  {categoryLabel(t.category)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                  {t.categorySource ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          Terug
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Verder
        </button>
      </div>
    </section>
  );
}
