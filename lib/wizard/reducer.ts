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
        // Reset any stale correction-step state if the user re-uploads.
        suggestions: null,
        userCategories: {},
        suggestionsFallback: false,
      };

    case "PROCESS_ERROR":
      return { ...state, loading: false, error: action.message };

    case "DISMISS_ERROR":
      return { ...state, error: null };

    case "GO_TO_STEP":
      return { ...state, step: action.step, error: null };

    case "LOAD_SUGGESTIONS_START":
      return {
        ...state,
        suggestionsLoading: true,
        suggestionsFallback: false,
        error: null,
      };

    case "LOAD_SUGGESTIONS_SUCCESS":
      return {
        ...state,
        suggestionsLoading: false,
        suggestions: action.suggestions,
        userCategories: { ...action.suggestions },
        suggestionsFallback: action.fallback,
      };

    case "LOAD_SUGGESTIONS_ERROR":
      return {
        ...state,
        suggestionsLoading: false,
        error: action.message,
        suggestionsFallback: true,
      };

    case "UPDATE_USER_CATEGORY":
      return {
        ...state,
        userCategories: {
          ...state.userCategories,
          [action.id]: action.category,
        },
      };

    case "SUBMIT_CORRECTIONS_START":
      return { ...state, submitting: true, error: null };

    case "SUBMIT_CORRECTIONS_SUCCESS":
      return {
        ...state,
        submitting: false,
        error: null,
        processResult: action.patched,
        step: "result",
        // Reset result-step state so the auto-calculate effect re-runs
        // when the user goes back to corrections and re-submits.
        inflationCalculation: null,
        inflationMeta: null,
        calculating: false,
      };

    case "SUBMIT_CORRECTIONS_ERROR":
      return { ...state, submitting: false, error: action.message };

    case "CALCULATE_INFLATION_START":
      return { ...state, calculating: true, error: null };

    case "CALCULATE_INFLATION_SUCCESS":
      return {
        ...state,
        calculating: false,
        error: null,
        inflationCalculation: action.calculation,
        inflationMeta: action.meta,
      };

    case "CALCULATE_INFLATION_ERROR":
      return { ...state, calculating: false, error: action.message };

    case "RESET":
      return { ...INITIAL_STATE };
  }
}
