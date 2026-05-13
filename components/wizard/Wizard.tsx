"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { wizardReducer } from "@/lib/wizard/reducer";
import {
  shouldCalculateInflation,
  shouldLoadSuggestions,
} from "@/lib/wizard/effects";
import {
  INITIAL_STATE,
  type InflationMeta,
  type ProcessResult,
  type ProcessTransaction,
} from "@/lib/wizard/types";
import type { CategoryCode } from "@/lib/cbs/types";
import type { InflationCalculation } from "@/lib/inflation/types";
import { ErrorBanner } from "./ErrorBanner";
import { ProgressIndicator } from "./ProgressIndicator";
import { StepBank } from "./StepBank";
import { StepCorrect } from "./StepCorrect";
import { StepResult } from "./StepResult";
import { StepReview } from "./StepReview";
import { StepUpload } from "./StepUpload";

async function uploadAndProcess(file: File): Promise<ProcessResult> {
  const form = new FormData();
  form.set("file", file);
  const res = await fetch("/api/process", { method: "POST", body: form });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Verwerken mislukt (HTTP ${res.status}).`);
  }
  return (await res.json()) as ProcessResult;
}

interface SuggestResponse {
  suggestions: Array<{ id: string; suggestedCategory: CategoryCode }>;
}

async function fetchSuggestions(
  unknowns: ProcessTransaction[],
): Promise<Record<string, CategoryCode>> {
  const res = await fetch("/api/suggest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      transactions: unknowns.map((t) => ({
        id: t.id,
        merchant: t.merchant,
        description: t.description,
      })),
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Suggesties ophalen mislukt (HTTP ${res.status}).`);
  }
  const body = (await res.json()) as SuggestResponse;
  const out: Record<string, CategoryCode> = {};
  for (const s of body.suggestions) out[s.id] = s.suggestedCategory;
  return out;
}

async function postCorrections(
  entries: Array<{
    merchant: string | null;
    description: string;
    aiSuggested: CategoryCode | null;
    userChose: CategoryCode;
  }>,
): Promise<void> {
  if (entries.length === 0) return;
  await fetch("/api/correct", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ corrections: entries }),
  });
}

interface CalculateResponseBody {
  calculation: InflationCalculation;
  meta: InflationMeta;
}

async function calculateInflation(
  result: ProcessResult,
): Promise<CalculateResponseBody> {
  const res = await fetch("/api/calculate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      transactions: result.transactions.map((t) => ({
        id: t.id,
        date: t.date,
        amount: t.amount,
        merchant: t.merchant,
        description: t.description,
        category: t.category,
      })),
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Berekening mislukt (HTTP ${res.status}).`);
  }
  return (await res.json()) as CalculateResponseBody;
}

function fallbackSuggestions(unknowns: ProcessTransaction[]): Record<string, CategoryCode> {
  const out: Record<string, CategoryCode> = {};
  for (const t of unknowns) out[t.id] = "12";
  return out;
}

export function Wizard() {
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);

  /**
   * Tracks whether a /api/suggest call is currently pending. Lives in a
   * ref (not React state) so dispatching LOAD_SUGGESTIONS_START does not
   * trigger the effect cleanup and silently cancel its own fetch. See
   * `shouldLoadSuggestions` and the comment on the effect below.
   */
  const fetchInFlight = useRef(false);
  /** Same trick for the /api/calculate effect. */
  const calculateInFlight = useRef(false);

  const handleProcess = useCallback(async () => {
    if (!state.uploadedFile) return;
    dispatch({ type: "START_PROCESSING" });
    try {
      const result = await uploadAndProcess(state.uploadedFile);
      dispatch({ type: "PROCESS_SUCCESS", result });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Onbekende fout bij verwerken.";
      dispatch({ type: "PROCESS_ERROR", message });
    }
  }, [state.uploadedFile]);

  /**
   * Auto-load AI suggestions when entering the correction step.
   *
   * NOTE: `state.suggestionsLoading` is deliberately NOT in the dependency
   * array. Dispatching `LOAD_SUGGESTIONS_START` flips that flag, which —
   * if it were a dep — would re-trigger this effect, run its cleanup, and
   * set `cancelled = true` before the fetch could resolve. The in-flight
   * guard lives on a useRef so the effect's own dispatch doesn't sabotage
   * the very fetch it just started. See React 18 strict mode + reducer
   * dispatch loops.
   */
  useEffect(() => {
    const precondition = {
      step: state.step,
      suggestionsLoaded: state.suggestions !== null,
      fetchInFlight: fetchInFlight.current,
      hasProcessResult: state.processResult !== null,
    };
    if (!shouldLoadSuggestions(precondition)) return;
    // processResult must exist by the time we get here (the predicate checks it).
    const result = state.processResult!;

    const unknowns = result.transactions.filter((t) => t.category === null);
    if (unknowns.length === 0) {
      dispatch({
        type: "LOAD_SUGGESTIONS_SUCCESS",
        suggestions: {},
        fallback: false,
      });
      return;
    }

    let cancelled = false;
    fetchInFlight.current = true;
    dispatch({ type: "LOAD_SUGGESTIONS_START" });
    fetchSuggestions(unknowns)
      .then((suggestions) => {
        fetchInFlight.current = false;
        if (cancelled) return;
        dispatch({
          type: "LOAD_SUGGESTIONS_SUCCESS",
          suggestions,
          fallback: false,
        });
      })
      .catch(() => {
        fetchInFlight.current = false;
        if (cancelled) return;
        dispatch({
          type: "LOAD_SUGGESTIONS_SUCCESS",
          suggestions: fallbackSuggestions(unknowns),
          fallback: true,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [state.step, state.suggestions, state.processResult]);

  /**
   * Auto-run the inflation calculation when entering the result step.
   * Same ref-based guard as the suggestions effect to avoid self-cancellation.
   */
  useEffect(() => {
    const precondition = {
      step: state.step,
      calculationLoaded: state.inflationCalculation !== null,
      fetchInFlight: calculateInFlight.current,
      hasProcessResult: state.processResult !== null,
    };
    if (!shouldCalculateInflation(precondition)) return;
    const result = state.processResult!;

    let cancelled = false;
    calculateInFlight.current = true;
    dispatch({ type: "CALCULATE_INFLATION_START" });
    calculateInflation(result)
      .then(({ calculation, meta }) => {
        calculateInFlight.current = false;
        if (cancelled) return;
        dispatch({
          type: "CALCULATE_INFLATION_SUCCESS",
          calculation,
          meta,
        });
      })
      .catch((err) => {
        calculateInFlight.current = false;
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "Onbekende fout bij berekening.";
        dispatch({ type: "CALCULATE_INFLATION_ERROR", message });
      });

    return () => {
      cancelled = true;
    };
  }, [state.step, state.inflationCalculation, state.processResult]);

  const handleSubmitCorrections = useCallback(async () => {
    if (!state.processResult) return;
    dispatch({ type: "SUBMIT_CORRECTIONS_START" });

    const suggestions = state.suggestions ?? {};
    const overrideEntries: Array<{
      merchant: string | null;
      description: string;
      aiSuggested: CategoryCode | null;
      userChose: CategoryCode;
    }> = [];
    for (const t of state.processResult.transactions) {
      if (t.category !== null) continue;
      const chosen = state.userCategories[t.id];
      if (!chosen) continue;
      const suggested = suggestions[t.id];
      // Log only when the user actually overrode the suggestion.
      if (chosen !== suggested) {
        overrideEntries.push({
          merchant: t.merchant,
          description: t.description,
          aiSuggested: state.suggestionsFallback ? null : suggested ?? null,
          userChose: chosen,
        });
      }
    }

    try {
      await postCorrections(overrideEntries);
    } catch {
      // Logging is best-effort; never block the UX.
    }

    // Patch the process result so downstream steps see the user's choices.
    const patched: ProcessResult = {
      ...state.processResult,
      transactions: state.processResult.transactions.map((t) => {
        if (t.category !== null) return t;
        const chosen = state.userCategories[t.id];
        if (!chosen) return t;
        return { ...t, category: chosen, categorySource: "user" as const };
      }),
      categorizedCount: state.processResult.transactions.filter(
        (t) => t.category !== null || state.userCategories[t.id],
      ).length,
      unknownCount: state.processResult.transactions.filter(
        (t) => t.category === null && !state.userCategories[t.id],
      ).length,
    };

    dispatch({ type: "SUBMIT_CORRECTIONS_SUCCESS", patched });
  }, [state.processResult, state.suggestions, state.userCategories, state.suggestionsFallback]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <ProgressIndicator current={state.step} />

      {state.error && (
        <ErrorBanner
          message={state.error}
          onRetry={state.uploadedFile && state.step === "upload" ? handleProcess : undefined}
          onDismiss={() => dispatch({ type: "DISMISS_ERROR" })}
        />
      )}

      {state.step === "bank" && (
        <StepBank
          onSelect={(bank) => dispatch({ type: "SELECT_BANK", bank })}
        />
      )}

      {state.step === "upload" && (
        <StepUpload
          file={state.uploadedFile}
          loading={state.loading}
          onSelectFile={(file) => dispatch({ type: "SELECT_FILE", file })}
          onClearFile={() => dispatch({ type: "CLEAR_FILE" })}
          onProcess={handleProcess}
          onBack={() => dispatch({ type: "GO_TO_STEP", step: "bank" })}
        />
      )}

      {state.step === "review" && state.processResult && (
        <StepReview
          result={state.processResult}
          onBack={() => dispatch({ type: "GO_TO_STEP", step: "upload" })}
          onNext={() => dispatch({ type: "GO_TO_STEP", step: "correct" })}
        />
      )}

      {state.step === "correct" && state.processResult && (
        <StepCorrect
          result={state.processResult}
          suggestionsLoading={state.suggestionsLoading}
          suggestionsFallback={state.suggestionsFallback}
          userCategories={state.userCategories}
          submitting={state.submitting}
          onChange={(id, category) =>
            dispatch({ type: "UPDATE_USER_CATEGORY", id, category })
          }
          onBack={() => dispatch({ type: "GO_TO_STEP", step: "review" })}
          onSubmit={handleSubmitCorrections}
        />
      )}

      {state.step === "result" && state.processResult && (
        <StepResult
          result={state.processResult}
          calculation={state.inflationCalculation}
          meta={state.inflationMeta}
          calculating={state.calculating}
          onBack={() => dispatch({ type: "GO_TO_STEP", step: "correct" })}
          onReset={() => dispatch({ type: "RESET" })}
        />
      )}
    </div>
  );
}
