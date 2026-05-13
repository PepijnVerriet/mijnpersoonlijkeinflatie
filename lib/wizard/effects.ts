import type { WizardStep } from "./types";

/**
 * Precondition snapshot for the "auto-load AI suggestions" effect in
 * `components/wizard/Wizard.tsx`. Extracted into a pure function so the
 * decision logic can be unit-tested without spinning up React.
 */
export interface SuggestPrecondition {
  step: WizardStep;
  /** True when `state.suggestions !== null`. */
  suggestionsLoaded: boolean;
  /** True while a fetch is currently in flight (tracked via useRef). */
  fetchInFlight: boolean;
  /** True when there is a `processResult` to compute the unknown set from. */
  hasProcessResult: boolean;
}

/**
 * Decide whether the suggestions effect should kick off a new fetch.
 * Returns `true` only when on the `"correct"` step, suggestions haven't
 * been loaded yet, no fetch is in flight, and a `processResult` exists.
 *
 * Crucially, `fetchInFlight` is a *ref* (not React state) so dispatching
 * `LOAD_SUGGESTIONS_START` does not itself re-trigger the effect cleanup.
 * This avoids the self-cancellation loop the previous implementation hit
 * under React 18 strict mode + reducer dispatch.
 */
export function shouldLoadSuggestions(pre: SuggestPrecondition): boolean {
  if (pre.step !== "correct") return false;
  if (pre.suggestionsLoaded) return false;
  if (pre.fetchInFlight) return false;
  if (!pre.hasProcessResult) return false;
  return true;
}
