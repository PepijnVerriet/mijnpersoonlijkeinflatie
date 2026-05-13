"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getCategory } from "@/lib/cbs/categories";
import type { CategoryBreakdown } from "@/lib/inflation/types";

const POSITIVE_FILL = "#0d9488"; // teal-600
const NEGATIVE_FILL = "#16a34a"; // green-600
const MAX_BARS = 8;

interface ChartRow {
  category: string;
  label: string;
  contribution: number;
  weight: number;
  cbsRate: number;
}

function fmtPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: ChartRow }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
      <div className="mb-1 font-medium text-gray-900">{row.label}</div>
      <div className="text-gray-700">Gewicht: {(row.weight * 100).toFixed(1)}%</div>
      <div className="text-gray-700">CBS-rate: {fmtPct(row.cbsRate)}</div>
      <div className="font-medium text-gray-900">
        Bijdrage: {fmtPct(row.contribution)}
      </div>
    </div>
  );
}

interface InflationChartProps {
  breakdown: readonly CategoryBreakdown[];
}

export function InflationChart({ breakdown }: InflationChartProps) {
  const rows: ChartRow[] = breakdown.slice(0, MAX_BARS).map((b) => ({
    category: b.category,
    label: `${b.category} ${getCategory(b.category).shortName}`,
    contribution: Number(b.contribution.toFixed(3)),
    weight: b.weight,
    cbsRate: b.cbsRate,
  }));

  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Geen categorieën om te visualiseren.
      </p>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
        >
          <XAxis
            type="number"
            tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={140}
            stroke="#374151"
            fontSize={12}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "rgba(13, 148, 136, 0.06)" }}
          />
          <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
            {rows.map((row) => (
              <Cell
                key={row.category}
                fill={row.contribution >= 0 ? POSITIVE_FILL : NEGATIVE_FILL}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
