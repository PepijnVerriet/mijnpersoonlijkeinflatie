import { describe, expect, it } from "vitest";
import {
  shouldLoadSuggestions,
  type SuggestPrecondition,
} from "@/lib/wizard/effects";

const ready: SuggestPrecondition = {
  step: "correct",
  suggestionsLoaded: false,
  fetchInFlight: false,
  hasProcessResult: true,
};

describe("shouldLoadSuggestions", () => {
  it("returns true when all preconditions are met", () => {
    expect(shouldLoadSuggestions(ready)).toBe(true);
  });

  it("returns false when not on the correct step", () => {
    for (const step of ["bank", "upload", "review", "result"] as const) {
      expect(shouldLoadSuggestions({ ...ready, step })).toBe(false);
    }
  });

  it("returns false when suggestions have already been loaded", () => {
    expect(
      shouldLoadSuggestions({ ...ready, suggestionsLoaded: true }),
    ).toBe(false);
  });

  it("returns false when a fetch is already in flight (the bug we fixed)", () => {
    expect(
      shouldLoadSuggestions({ ...ready, fetchInFlight: true }),
    ).toBe(false);
  });

  it("returns false when there is no processResult yet", () => {
    expect(
      shouldLoadSuggestions({ ...ready, hasProcessResult: false }),
    ).toBe(false);
  });
});

/**
 * Behavioural test: this is the exact lifecycle the Wizard's useEffect now
 * follows, condensed into a synchronous simulation. The previous bug was
 * that `suggestionsLoading` toggling in React state caused the effect to
 * re-run and silently cancel its own fetch. With the in-flight guard kept
 * on a ref (here: a plain mutable variable), state changes can come in
 * freely without stomping on the pending fetch.
 */
describe("fetchInFlight guard simulates the Wizard effect lifecycle", () => {
  function simulate(): { firedRequests: number; cancelled: boolean } {
    const ref = { current: false };
    const cancelled = { value: false };
    let fired = 0;

    const tryFire = () => {
      if (!shouldLoadSuggestions({ ...ready, fetchInFlight: ref.current })) {
        return;
      }
      ref.current = true;
      fired += 1;
    };

    // 1. Initial entry on the "correct" step → fire one fetch.
    tryFire();

    // 2. Simulate what used to break things: a reducer dispatch causes the
    //    effect to re-run while the previous fetch is still pending.
    //    The cleanup of the previous run flips `cancelled`; the in-flight
    //    guard must prevent a second fetch.
    cancelled.value = true;
    tryFire();
    tryFire();
    tryFire();

    // 3. Fetch resolves: ref is released. Even now, no new fetch fires
    //    because the effect's deps haven't changed — we mimic that here
    //    by simply not calling tryFire after release.
    ref.current = false;

    return { firedRequests: fired, cancelled: cancelled.value };
  }

  it("fires exactly one fetch even under repeated re-entries", () => {
    const { firedRequests } = simulate();
    expect(firedRequests).toBe(1);
  });

  it("does not block a fresh attempt once the ref is released", () => {
    const ref = { current: false };
    let fired = 0;
    const tryFire = () => {
      if (!shouldLoadSuggestions({ ...ready, fetchInFlight: ref.current })) {
        return;
      }
      ref.current = true;
      fired += 1;
    };
    tryFire(); // first fetch
    expect(fired).toBe(1);
    ref.current = false; // fetch resolved
    tryFire(); // a brand-new attempt is allowed
    expect(fired).toBe(2);
  });
});
