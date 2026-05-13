import {
  INITIAL_STATE,
  type WizardAction,
  type WizardState,
} from "./types";

/**
 * Pure reducer for the wizard. Exported on its own so it can be unit-tested
 * without React. All transitions are deterministic; nothing reads the DOM
 * or talks to the network.
 */
export function wizardReducer(
  state: WizardState,
  action: WizardAction,
): WizardState {
  switch (action.type) {
    case "SELECT_BANK":
      return { ...state, bank: action.bank, step: "upload", error: null };

    case "SELECT_FILE":
      return { ...state, uploadedFile: action.file, error: null };

    case "CLEAR_FILE":
      return { ...state, uploadedFile: null };

    case "START_PROCESSING":
      return { ...state, loading: true, error: null };

    case "PROCESS_SUCCESS":
      return {
        ...state,
        loading: false,
        error: null,
        processResult: action.result,
        step: "review",
      };

    case "PROCESS_ERROR":
      return { ...state, loading: false, error: action.message };

    case "DISMISS_ERROR":
      return { ...state, error: null };

    case "GO_TO_STEP":
      return { ...state, step: action.step, error: null };

    case "RESET":
      return { ...INITIAL_STATE };
  }
}
