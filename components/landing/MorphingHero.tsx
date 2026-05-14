"use client";

import { useEffect, useState } from "react";

const VALUES = [3.5, 4.8, 2.1, 5.6, 3.2, 4.1, 2.7, 6.0];

function formatNl(n: number): string {
  return n.toLocaleString("nl-NL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function MorphingHero() {
  const [idx, setIdx] = useState(1);
  const [animValue, setAnimValue] = useState(VALUES[1]);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % VALUES.length);
    }, 2300);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const target = VALUES[idx];
    const start = animValue;
    const dur = 900;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimValue(start + (target - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // animValue uitsluiten: alleen idx-wisselingen triggeren een nieuwe tween
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  return (
    <div className="relative overflow-hidden rounded-[14px] border border-border bg-surface p-[30px_24px] md:p-[48px_40px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
      <div className="relative">
        <div className="mb-3.5 text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
          Persoonlijke inflatie
        </div>
        <div
          className="font-serif text-[88px] font-medium leading-[0.95] tracking-[-0.04em] text-accent tabular-nums md:text-[140px]"
        >
          {formatNl(animValue)}
          <span className="font-serif text-ink-3"> %</span>
        </div>
        <div className="mt-[22px] flex flex-wrap gap-1.5">
          {VALUES.map((v, i) => {
            const active = i === idx;
            return (
              <div
                key={i}
                className={`inline-flex h-[26px] items-center rounded-[13px] border px-2.5 font-mono text-[11.5px] transition-all duration-300 ${
                  active
                    ? "border-accent bg-accent text-accent-on"
                    : "border-border bg-surface-2 text-ink-3"
                }`}
              >
                {formatNl(v)} %
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex items-baseline justify-between border-t border-border pt-[22px] text-[13px] text-ink-3">
          <span>CBS-gemiddelde</span>
          <span className="font-mono text-sm text-ink-1">3,5&nbsp;%</span>
        </div>
      </div>
    </div>
  );
}
