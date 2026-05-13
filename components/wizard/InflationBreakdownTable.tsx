import { getCategory } from "@/lib/cbs/categories";
import type { CategoryBreakdown } from "@/lib/inflation/types";

interface InflationBreakdownTableProps {
  breakdown: readonly CategoryBreakdown[];
  totalInflation: number;
}

function fmtPct(n: number, digits = 2): string {
  return `${n.toFixed(digits)}%`;
}

function fmtAmount(n: number): string {
  return n.toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

export function InflationBreakdownTable({
  breakdown,
  totalInflation,
}: InflationBreakdownTableProps) {
  const totalSpending = breakdown.reduce((s, b) => s + b.spending, 0);
  const totalWeight = breakdown.reduce((s, b) => s + b.weight, 0);

  return (
    <div className="overflow-x-auto rounded border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th scope="col" className="px-3 py-2 text-left">Categorie</th>
            <th scope="col" className="px-3 py-2 text-right">Uitgaven</th>
            <th scope="col" className="px-3 py-2 text-right">Gewicht</th>
            <th scope="col" className="px-3 py-2 text-right">CBS-rate</th>
            <th scope="col" className="px-3 py-2 text-right">Bijdrage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {breakdown.map((b) => {
            const meta = getCategory(b.category);
            return (
              <tr key={b.category}>
                <td className="whitespace-nowrap px-3 py-2 text-gray-900">
                  <span className="text-gray-500">{b.category}</span>{" "}
                  {meta.shortName}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-gray-700">
                  {fmtAmount(b.spending)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-gray-700">
                  {fmtPct(b.weight * 100, 1)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-gray-700">
                  {fmtPct(b.cbsRate)}
                </td>
                <td
                  className={`whitespace-nowrap px-3 py-2 text-right font-medium ${
                    b.contribution >= 0 ? "text-teal-700" : "text-green-700"
                  }`}
                >
                  {fmtPct(b.contribution)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-50 text-sm font-medium text-gray-900">
          <tr>
            <td className="px-3 py-2">Totaal</td>
            <td className="whitespace-nowrap px-3 py-2 text-right">
              {fmtAmount(totalSpending)}
            </td>
            <td className="whitespace-nowrap px-3 py-2 text-right">
              {fmtPct(totalWeight * 100, 1)}
            </td>
            <td className="px-3 py-2 text-right text-gray-400">—</td>
            <td className="whitespace-nowrap px-3 py-2 text-right">
              {fmtPct(totalInflation)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
