import { getCategory } from "@/lib/cbs/categories";
import type { CategoryBreakdown } from "@/lib/inflation/types";

interface BreakdownCardsProps {
  breakdown: readonly CategoryBreakdown[];
  totalInflation: number;
}

function fmtAmount(n: number): string {
  return n.toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

function fmtPctSigned(n: number, digits = 2): string {
  const sign = n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(digits)} %`;
}

function fmtPctPlain(n: number, digits = 1): string {
  return `${n.toFixed(digits)} %`;
}

export function BreakdownCards({
  breakdown,
  totalInflation,
}: BreakdownCardsProps) {
  const totalSpending = breakdown.reduce((s, b) => s + b.spending, 0);
  const totalWeight = breakdown.reduce((s, b) => s + b.weight, 0);

  return (
    <div className="space-y-2">
      {breakdown.map((b) => {
        const meta = getCategory(b.category);
        const strong = Math.abs(b.contribution) > 0.5;
        return (
          <div
            key={b.category}
            className="rounded-token border border-border bg-surface p-4"
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[12px] text-ink-3">
                  {b.category}
                </span>{" "}
                <span className="text-[14.5px] font-medium text-ink-1">
                  {meta.shortName}
                </span>
              </div>
              <span
                className={`shrink-0 font-mono text-[14px] tabular-nums ${
                  strong ? "font-semibold text-accent" : "text-ink-1"
                }`}
              >
                {fmtPctSigned(b.contribution)}
              </span>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 border-t border-border pt-2.5 text-[13px]">
              <dt className="text-ink-3">Uitgaven</dt>
              <dd className="m-0 text-right font-mono tabular-nums text-ink-2">
                {fmtAmount(b.spending)}
              </dd>
              <dt className="text-ink-3">Jouw gewicht</dt>
              <dd className="m-0 text-right font-mono tabular-nums text-ink-2">
                {fmtPctPlain(b.weight * 100, 1)}
              </dd>
              <dt className="text-ink-3">CBS-rate</dt>
              <dd className="m-0 text-right font-mono tabular-nums text-ink-2">
                {fmtPctSigned(b.cbsRate, 1)}
              </dd>
            </dl>
          </div>
        );
      })}
      <div className="rounded-token border border-border bg-surface-2 p-4">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <span className="text-[14.5px] font-medium text-ink-1">Totaal</span>
          <span className="shrink-0 font-mono text-[14px] font-semibold tabular-nums text-accent">
            {fmtPctSigned(totalInflation)}
          </span>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 border-t border-border pt-2.5 text-[13px]">
          <dt className="text-ink-3">Uitgaven</dt>
          <dd className="m-0 text-right font-mono tabular-nums text-ink-1">
            {fmtAmount(totalSpending)}
          </dd>
          <dt className="text-ink-3">Jouw gewicht</dt>
          <dd className="m-0 text-right font-mono tabular-nums text-ink-1">
            {fmtPctPlain(totalWeight * 100, 1)}
          </dd>
        </dl>
      </div>
    </div>
  );
}
