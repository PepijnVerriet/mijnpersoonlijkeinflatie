"use client";

import { useEffect, useState } from "react";
import { getCategory } from "@/lib/cbs/categories";
import type { CategoryBreakdown } from "@/lib/inflation/types";

const MAX_BARS = 8;

function fmtPp(value: number): string {
  const sign = value < 0 ? "−" : "+";
  return `${sign}${Math.abs(value).toLocaleString("nl-NL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}pp`;
}

interface BreakdownRowProps {
  label: string;
  contribution: number;
  weight: number;
  cbsRate: number;
  max: number;
  delayMs: number;
}

function BreakdownRow({
  label,
  contribution,
  weight,
  cbsRate,
  max,
  delayMs,
}: BreakdownRowProps) {
  const [w, setW] = useState(0);
  const [hover, setHover] = useState(false);
  const targetPct = max > 0 ? (Math.abs(contribution) / max) * 100 : 0;

  useEffect(() => {
    const t = setTimeout(() => setW(targetPct), 200 + delayMs);
    return () => clearTimeout(t);
  }, [targetPct, delayMs]);

  const isStrong = Math.abs(contribution) > max * 0.4;
  const isNegative = contribution < 0;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative grid grid-cols-[120px_1fr_80px] items-center gap-3.5 rounded-token-sm px-3 py-2.5 transition-colors hover:bg-surface-2 md:grid-cols-[200px_1fr_90px]"
    >
      <div className="truncate text-[13.5px] font-normal text-ink-1">
        {label}
      </div>
      <div className="relative flex h-[22px] items-center">
        <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
        <div
          className={`relative h-[22px] rounded-[3px] transition-[width] duration-[900ms] ease-out ${
            isStrong ? "bg-accent" : "bg-accent/55"
          } ${isNegative ? "opacity-60" : ""}`}
          style={{ width: `${w}%` }}
        />
        {hover && (
          <div
            className="pointer-events-none absolute z-10 whitespace-nowrap rounded font-mono text-[11px] text-bg shadow-md"
            style={{
              top: -38,
              left: `${Math.min(w, 80)}%`,
              background: "var(--ink-1)",
              padding: "6px 10px",
            }}
          >
            gewicht {(weight * 100).toFixed(1)} % · rate {cbsRate.toFixed(1)} %
          </div>
        )}
      </div>
      <div className="text-right font-mono text-[13px] font-medium tabular-nums text-ink-1">
        {fmtPp(contribution)}
      </div>
    </div>
  );
}

interface BreakdownBarsProps {
  breakdown: readonly CategoryBreakdown[];
}

export function BreakdownBars({ breakdown }: BreakdownBarsProps) {
  const rows = breakdown
    .filter((b) => Math.abs(b.weight) > 0.001)
    .slice(0, MAX_BARS);
  const maxContrib = rows.length
    ? Math.max(...rows.map((r) => Math.abs(r.contribution)))
    : 0;

  if (rows.length === 0) {
    return (
      <p className="p-4 text-sm text-ink-3">
        Geen categorieën om te visualiseren.
      </p>
    );
  }

  return (
    <div className="grid gap-0.5">
      {rows.map((r, i) => (
        <BreakdownRow
          key={r.category}
          label={getCategory(r.category).shortName}
          contribution={r.contribution}
          weight={r.weight}
          cbsRate={r.cbsRate}
          max={maxContrib}
          delayMs={i * 80}
        />
      ))}
    </div>
  );
}
