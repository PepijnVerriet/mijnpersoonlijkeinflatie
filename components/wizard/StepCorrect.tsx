"use client";

import { Button } from "@/components/ui/Button";
import { ArrowIcon, CheckIcon, SparkIcon, WarnIcon } from "@/components/ui/icons";
import { CATEGORIES, getCategory } from "@/lib/cbs/categories";
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
  const totalCount = result.transactionCount;
  const unknownSpending = unknowns.reduce((s, t) => s + t.amount, 0);
  const totalSpending = result.transactions.reduce((s, t) => s + t.amount, 0);
  const sharePct =
    totalSpending > 0 ? (unknownSpending / totalSpending) * 100 : 0;
  const decidedCount = unknowns.filter((t) => userCategories[t.id]).length;

  if (unknowns.length === 0) {
    return (
      <section className="mx-auto max-w-[720px] px-[22px] py-12 md:px-12 md:py-20">
        <div className="rounded-token-lg border border-border bg-surface p-8 text-center md:p-12">
          <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-pos-soft text-pos">
            <CheckIcon size={22} />
          </div>
          <span className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
            Alles gelukt
          </span>
          <h1 className="m-0 mb-3 mt-3 font-serif text-[28px] font-medium tracking-[-0.02em] text-ink-1 md:text-[36px]">
            Geen correcties nodig.
          </h1>
          <p className="m-0 mb-8 text-[15px] leading-[1.55] text-ink-2">
            We konden alle {totalCount} transacties automatisch categoriseren.
            Klik op <strong className="font-medium">Verder</strong> om je
            persoonlijke inflatie te zien.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={onBack}>
              <ArrowIcon size={14} dir="left" /> Vorige
            </Button>
            <Button variant="primary" onClick={onSubmit} disabled={submitting}>
              Verder naar resultaat <ArrowIcon size={14} />
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1080px] px-[22px] py-7 md:px-12 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
            Laatste stap voor je cijfer
          </span>
          <h1 className="m-0 mb-2.5 mt-2.5 font-serif text-[30px] font-medium tracking-[-0.02em] text-ink-1 md:text-[40px]">
            Help ons met de laatste {unknowns.length}{" "}
            {unknowns.length === 1 ? "transactie" : "transacties"}
          </h1>
          <p className="m-0 max-w-[640px] text-sm leading-[1.55] text-ink-2">
            Goed voor {sharePct.toFixed(1)}% van je uitgaven (
            {fmtAmount(unknownSpending)}). We hebben een gokje gewaagd — kies de
            juiste categorie en we gaan rekenen.
          </p>
        </div>
        <div className="text-right font-mono text-[12.5px] text-ink-3">
          {decidedCount} / {unknowns.length} gekozen
        </div>
      </div>

      {suggestionsLoading && (
        <div className="mt-6 flex items-center gap-3 rounded-token border border-accent-soft bg-accent-soft/60 px-4 py-3">
          <Spinner
            label={`AI doet suggesties voor ${unknowns.length} ${
              unknowns.length === 1 ? "transactie" : "transacties"
            }…`}
          />
        </div>
      )}

      {suggestionsFallback && !suggestionsLoading && (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 rounded-token border border-warn-soft bg-warn-soft px-4 py-3 text-[13.5px] text-warn"
        >
          <WarnIcon size={14} />
          <div>
            AI-suggesties zijn niet beschikbaar. De dropdowns staan standaard op{" "}
            <strong className="font-medium">12 Diversen</strong>; pas elke
            transactie handmatig aan.
          </div>
        </div>
      )}

      <div className="mt-7 grid gap-2">
        {unknowns.map((t) => {
          const chosen = userCategories[t.id] ?? "12";
          const label = t.merchant ?? t.description.slice(0, 80);
          const aiCat = (() => {
            try {
              return getCategory(chosen).shortName;
            } catch {
              return "";
            }
          })();
          return (
            <div
              key={t.id}
              className="grid grid-cols-1 items-center gap-3 rounded-token border border-border bg-surface p-4 md:grid-cols-[1fr_auto] md:gap-6 md:p-5"
            >
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-baseline gap-2.5">
                  <span className="text-[14.5px] font-medium text-ink-1">
                    {label}
                  </span>
                  <span className="font-mono text-[12px] text-ink-3">
                    {fmtDate(t.date)} · {fmtAmount(t.amount)}
                  </span>
                </div>
                <div className="flex items-start gap-1.5 text-[12.5px] leading-[1.45] text-ink-3">
                  <span className="mt-0.5">
                    <SparkIcon size={11} />
                  </span>
                  <span>
                    <span className="text-accent">AI denkt:</span> {aiCat}.
                  </span>
                </div>
              </div>
              <select
                value={chosen}
                disabled={suggestionsLoading || submitting}
                onChange={(e) => onChange(t.id, e.target.value as CategoryCode)}
                aria-label={`Categorie voor ${label}`}
                className="w-full min-w-0 rounded-token-sm border border-border-strong bg-surface px-3.5 py-2.5 font-sans text-[13.5px] text-ink-1 transition-colors hover:border-accent focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft disabled:cursor-not-allowed disabled:bg-surface-2 md:w-[240px]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} {c.shortName}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div className="mt-9 flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          onClick={onBack}
          disabled={submitting}
        >
          <ArrowIcon size={14} dir="left" /> Vorige
        </Button>
        <div className="flex items-center gap-3">
          {submitting && <Spinner label="Opslaan…" />}
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={suggestionsLoading || submitting}
          >
            Bereken mijn inflatie <ArrowIcon size={14} />
          </Button>
        </div>
      </div>
    </section>
  );
}
