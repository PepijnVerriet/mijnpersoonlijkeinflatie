"use client";

import { useEffect, useState } from "react";

interface BarRowProps {
  label: string;
  value: number;
  max: number;
  emphasize?: boolean;
}

function BarRow({ label, value, max, emphasize = false }: BarRowProps) {
  const pct = max > 0 ? (Math.abs(value) / max) * 100 : 0;
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
        <span className={`text-ink-2 ${emphasize ? "font-medium" : ""}`}>
          {label}
        </span>
        <span
          className={`font-mono tabular-nums ${
            emphasize ? "text-[14px] font-semibold text-accent" : "text-[14px] font-medium text-ink-3"
          }`}
        >
          {value.toLocaleString("nl-NL", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          %
        </span>
      </div>
      <div
        className={`overflow-hidden rounded-[3px] bg-surface-2 ${
          emphasize ? "h-2.5" : "h-1.5"
        }`}
      >
        <div
          className={`h-full rounded-[3px] transition-[width] duration-[900ms] ease-out ${
            emphasize ? "bg-accent" : "bg-ink-3"
          }`}
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  );
}

interface ComparisonBarsProps {
  personal: number;
  reference: number;
}

export function ComparisonBars({ personal, reference }: ComparisonBarsProps) {
  const max = Math.max(Math.abs(personal), Math.abs(reference)) * 1.2;
  return (
    <div className="grid gap-[18px]">
      <BarRow label="Jouw inflatie" value={personal} max={max} emphasize />
      <BarRow label="CBS-gemiddelde" value={reference} max={max} />
    </div>
  );
}
