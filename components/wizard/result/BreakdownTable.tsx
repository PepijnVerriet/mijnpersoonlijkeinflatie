import { getCategory } from "@/lib/cbs/categories";
import type { CategoryBreakdown } from "@/lib/inflation/types";

interface BreakdownTableProps {
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

export function BreakdownTable({
  breakdown,
  totalInflation,
}: BreakdownTableProps) {
  const totalSpending = breakdown.reduce((s, b) => s + b.spending, 0);
  const totalWeight = breakdown.reduce((s, b) => s + b.weight, 0);

  return (
    <div className="overflow-x-auto rounded-token border border-border bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-border-strong">
            <th className="px-4 py-3 text-left text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-3">
              Categorie
            </th>
            <th className="px-4 py-3 text-right text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-3">
              Uitgaven
            </th>
            <th className="px-4 py-3 text-right text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-3">
              Jouw gewicht
            </th>
            <th className="px-4 py-3 text-right text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-3">
              CBS-rate
            </th>
            <th className="px-4 py-3 text-right text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-3">
              Bijdrage
            </th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((b) => {
            const meta = getCategory(b.category);
            const strong = Math.abs(b.contribution) > 0.5;
            return (
              <tr
                key={b.category}
                className="border-b border-border transition-colors hover:bg-surface-2"
              >
                <td className="px-4 py-3 font-medium text-ink-1">
                  <span className="text-ink-3">{b.category}</span>{" "}
                  {meta.shortName}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-ink-2">
                  {fmtAmount(b.spending)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-ink-2">
                  {fmtPctPlain(b.weight * 100, 1)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-ink-2">
                  {fmtPctSigned(b.cbsRate, 1)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono text-[13px] tabular-nums ${
                    strong ? "font-semibold text-accent" : "text-ink-1"
                  }`}
                >
                  {fmtPctSigned(b.contribution)}
                </td>
              </tr>
            );
          })}
          <tr className="bg-surface-2 font-medium">
            <td className="px-4 py-3 text-ink-1">Totaal</td>
            <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-ink-1">
              {fmtAmount(totalSpending)}
            </td>
            <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-ink-1">
              {fmtPctPlain(totalWeight * 100, 1)}
            </td>
            <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-ink-3">
              —
            </td>
            <td className="px-4 py-3 text-right font-mono text-[13px] font-semibold tabular-nums text-accent">
              {fmtPctSigned(totalInflation)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
