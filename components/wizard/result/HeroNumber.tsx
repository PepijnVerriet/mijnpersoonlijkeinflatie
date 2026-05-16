"use client";

import { useEffect, useState } from "react";

interface HeroNumberProps {
  target: number;
}

export function HeroNumber({ target }: HeroNumberProps) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    const dur = 1500;
    const t0 = performance.now();
    const tick = (now: number) => {
      if (cancelled) return;
      const p = Math.min(1, (now - t0) / dur);
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setShown(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [target]);

  const sign = target < 0 ? "−" : "";
  const abs = Math.abs(shown);

  return (
    <span className="block font-serif text-[64px] font-medium leading-[0.95] tracking-[-0.04em] text-accent tabular-nums md:text-[140px]">
      {sign}
      {abs.toLocaleString("nl-NL", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
      <span className="font-serif font-normal text-ink-3"> %</span>
    </span>
  );
}
