"use client";

import { useEffect, useState } from "react";

/**
 * Returns `true` when the viewport is at or below `maxWidth` pixels wide,
 * `false` otherwise. SSR-safe: starts `false`, updates on mount via
 * `matchMedia`, and tracks live resizes.
 *
 * Default threshold matches Tailwind's `md` breakpoint (768px) so that
 * "narrow" lines up with the existing responsive utilities in the app.
 */
export function useIsNarrowViewport(maxWidth = 767): boolean {
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    setIsNarrow(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [maxWidth]);
  return isNarrow;
}
