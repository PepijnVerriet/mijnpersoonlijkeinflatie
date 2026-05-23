"use client";

import { useEffect, useState } from "react";

/**
 * Returns `true` once we've confirmed that `navigator.share` is available in
 * the current environment, `false` otherwise. The check runs in `useEffect`
 * so the SSR pass renders `false` consistently — preventing hydration
 * mismatches when the actual browser environment turns out to support the
 * API (typical on mobile Safari, Chrome Android, recent Chrome desktop).
 */
export function useCanShare(): boolean {
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setCanShare(true);
    }
  }, []);
  return canShare;
}
