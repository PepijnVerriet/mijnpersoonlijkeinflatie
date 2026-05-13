"use client";

import { useCallback, useReducer } from "react";
import { wizardReducer } from "@/lib/wizard/reducer";
import { INITIAL_STATE, type ProcessResult } from "@/lib/wizard/types";
import { ErrorBanner } from "./ErrorBanner";
import { ProgressIndicator } from "./ProgressIndicator";
import { StepBank } from "./StepBank";
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

export function Wizard() {
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <ProgressIndicator current={state.step} />

      {state.error && (
        <ErrorBanner
          message={state.error}
          onRetry={state.uploadedFile ? handleProcess : undefined}
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
          onNext={() =>
            alert(
              "De categorisatie-correctie (module 4e-1b) komt in een volgende sessie.",
            )
          }
        />
      )}
    </div>
  );
}
