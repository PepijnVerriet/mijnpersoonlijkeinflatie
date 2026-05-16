"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowIcon, SparkIcon, WarnIcon } from "@/components/ui/icons";
import { getCategory } from "@/lib/cbs/categories";
import type { ProcessResult, ProcessTransaction } from "@/lib/wizard/types";

type CategorySource = ProcessTransaction["categorySource"];

interface StepReviewProps {
  result: ProcessResult;
  onBack: () => void;
  onNext: () => void;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}`;
}

function fmtAmount(n: number): string {
  return n.toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

function categoryShort(code: string | null): string {
  if (!code) return "—";
  try {
    return getCategory(code as never).shortName;
  } catch {
    return code;
  }
}

function sourceBadge(source: CategorySource | null) {
  if (source === "keyword") return <Badge>keyword</Badge>;
  if (source === "ai")
    return (
      <Badge tone="accent">
        <SparkIcon size={10} /> AI
      </Badge>
    );
  if (source === "user") return <Badge tone="pos">jij</Badge>;
  return <Badge tone="warn">controleer</Badge>;
}

export function StepReview({ result, onBack, onNext }: StepReviewProps) {
  const total = result.transactionCount;
  const categorised = result.categorizedCount;
  const unknown = result.unknownCount;
  const totalEur = result.transactions.reduce((s, t) => s + t.amount, 0);
  const unknownEur = result.transactions
    .filter((t) => t.category === null)
    .reduce((s, t) => s + t.amount, 0);
  const coveragePct = total > 0 ? ((categorised / total) * 100).toFixed(0) : "0";
  const unknownEurPct =
    totalEur > 0 ? ((unknownEur / totalEur) * 100).toFixed(1) : "0,0";

  const kpis: Array<{ label: string; value: string; sub: string; warn?: boolean }> = [
    { label: "Transacties", value: total.toString(), sub: "in dit afschrift" },
    { label: "Totaal", value: fmtAmount(totalEur), sub: "uitgaven" },
    {
      label: "Auto-categorisatie",
      value: `${categorised} / ${total}`,
      sub: `${coveragePct}% dekking`,
    },
    {
      label: "Te controleren",
      value: unknown.toString(),
      sub: `${unknownEurPct}% van €`,
      warn: unknown > 0,
    },
  ];

  return (
    <section className="mx-auto flex max-w-[1180px] flex-col px-[22px] py-7 md:px-12 md:py-12">
      <div>
        <span className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
          Controleer · transacties
        </span>
        <h1 className="m-0 mb-2 mt-2.5 font-serif text-[30px] font-medium tracking-[-0.02em] text-ink-1 md:text-[40px]">
          Controleer je transacties
        </h1>
        <p className="m-0 max-w-[600px] text-sm text-ink-3">
          We hebben {categorised} van {total} transacties automatisch
          gecategoriseerd. Klopt alles?
        </p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`rounded-token border p-[18px] ${
              k.warn
                ? "border-transparent bg-warn-soft"
                : "border-border bg-surface"
            }`}
          >
            <div className="mb-2 text-[11px] uppercase tracking-[0.06em] text-ink-3">
              {k.label}
            </div>
            <div
              className={`font-serif text-[22px] font-medium tabular-nums tracking-[-0.02em] md:text-[28px] ${
                k.warn ? "text-warn" : "text-ink-1"
              }`}
            >
              {k.value}
            </div>
            <div className="mt-1.5 font-mono text-[11.5px] text-ink-3">
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto rounded-token border border-border bg-surface">
        <table className="w-full min-w-[640px] border-collapse text-[13.5px]">
          <thead>
            <tr className="border-b border-border-strong">
              <th className="px-4 py-3 text-left text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-3">
                Datum
              </th>
              <th className="px-4 py-3 text-left text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-3">
                Handelaar
              </th>
              <th className="px-4 py-3 text-left text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-3">
                Categorie
              </th>
              <th className="px-4 py-3 text-left text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-3">
                Bron
              </th>
              <th className="px-4 py-3 text-right text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-3">
                Bedrag
              </th>
            </tr>
          </thead>
          <tbody>
            {result.transactions.map((t) => {
              const unk = t.category === null;
              return (
                <tr
                  key={t.id}
                  className={`border-b border-border transition-colors hover:bg-surface-2 ${
                    unk ? "bg-warn-soft/60" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-[12px] text-ink-3">
                    {fmtDate(t.date)}
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-3 font-medium text-ink-1">
                    {t.merchant ?? t.description.slice(0, 60)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[12.5px] ${
                        unk ? "italic text-warn" : "text-ink-2"
                      }`}
                    >
                      {unk && <WarnIcon size={11} />}
                      {categoryShort(t.category)}
                      {unk && (
                        <span className="text-ink-4">(controle nodig)</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">{sourceBadge(t.categorySource)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-ink-1">
                    {fmtAmount(t.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-9 flex flex-wrap justify-between gap-3">
        <Button variant="secondary" onClick={onBack}>
          <ArrowIcon size={14} dir="left" /> Vorige
        </Button>
        <Button variant="primary" onClick={onNext}>
          {unknown > 0
            ? `Categoriseer ${unknown} transactie${unknown === 1 ? "" : "s"}`
            : "Door naar resultaat"}{" "}
          <ArrowIcon size={14} />
        </Button>
      </div>
    </section>
  );
}
