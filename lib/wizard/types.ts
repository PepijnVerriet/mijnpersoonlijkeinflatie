import type { CategoryCode } from "@/lib/cbs/types";
import type { InflationCalculation } from "@/lib/inflation/types";
import type { BankId } from "@/lib/types";

/** Server-side metadata attached to every /api/calculate response. */
export interface InflationMeta {
  usingMockData: boolean;
  calculatedAt: string;
  /** Number of submitted transactions the server skipped (module 6b). */
  excludedCount: number;
  /** Total euro amount of those excluded transactions (module 6b). */
  excludedAmount: number;
}

/** Steps in the upload-and-review wizard. */
export type WizardStep = "bank" | "upload" | "review" | "correct" | "result";

/**
 * One transaction in the API response. Date is ISO-serialised so the wire
 * payload survives JSON. `categorySource` becomes `"user"` only once the
 * manual-correction step (4e-1b) lands.
 */
export interface ProcessTransaction {
  id: string;
  date: string;
  amount: number;
  merchant: string | null;
  description: string;
  category: CategoryCode | null;
  categorySource: "keyword" | "ai" | "user" | null;
}

/** Server response from `POST /api/process`. */
export interface ProcessResult {
  bank: BankId;
  transactionCount: number;
  categorizedCount: number;
  unknownCount: number;
  transactions: ProcessTransaction[];
}

/** Whole wizard state kept in React memory; nothing is persisted. */
export interface WizardState {
  step: WizardStep;
  bank: BankId | null;
  uploadedFile: File | null;
  processResult: ProcessResult | null;
  /** True while the API request is in flight. */
  loading: boolean;
  /** Last user-facing error, or `null` when none. */
  error: string | null;

  // -- Correction step (module 4e-1b) state ----------------------------------
  /** True while `/api/suggest` is in flight. */
  suggestionsLoading: boolean;
  /**
   * AI's initial best-guess per transaction id (only for `category===null`
   * transactions, so the dropdown can pre-select them). `null` until the
   * call has resolved.
   */
  suggestions: Record<string, CategoryCode> | null;
  /**
   * The category currently shown in each correction dropdown — starts as a
   * copy of `suggestions` and is mutated as the user picks alternatives.
   */
  userCategories: Record<string, CategoryCode>;
  /**
   * True if the suggest call failed and we fell back to default '12' for
   * every dropdown. The UI shows a banner so the user knows AI is offline.
   */
  suggestionsFallback: boolean;
  /** True while `/api/correct` is in flight. */
  submitting: boolean;

  // -- Result step (module 4e-1c) state --------------------------------------
  /** True while `/api/calculate` is in flight. */
  calculating: boolean;
  /** Result of the most recent inflation calculation. */
  inflationCalculation: InflationCalculation | null;
  /** Metadata around the inflation calculation (mock-data flag, timestamp). */
  inflationMeta: InflationMeta | null;

  // -- Exclusion (module 6b) state -------------------------------------------
  /**
   * IDs of transactions the user has excluded on the Review screen (6b-2).
   * Excluded transactions are dropped before correction (6b-3) and before
   * calculation (6b-4), and surfaced in the result transparency block (6b-5).
   * Set rather than array so toggling is O(1) and order-independent.
   */
  excludedTransactionIds: Set<string>;
}

/** Actions accepted by the reducer (see `lib/wizard/reducer.ts`). */
export type WizardAction =
  | { type: "SELECT_BANK"; bank: BankId }
  | { type: "SELECT_FILE"; file: File }
  | { type: "CLEAR_FILE" }
  | { type: "START_PROCESSING" }
  | { type: "PROCESS_SUCCESS"; result: ProcessResult }
  | { type: "PROCESS_ERROR"; message: string }
  | { type: "DISMISS_ERROR" }
  | { type: "GO_TO_STEP"; step: WizardStep }
  | { type: "LOAD_SUGGESTIONS_START" }
  | {
      type: "LOAD_SUGGESTIONS_SUCCESS";
      suggestions: Record<string, CategoryCode>;
      /** True when this came from the fallback path (AI was unavailable). */
      fallback: boolean;
    }
  | { type: "LOAD_SUGGESTIONS_ERROR"; message: string }
  | { type: "UPDATE_USER_CATEGORY"; id: string; category: CategoryCode }
  | { type: "SUBMIT_CORRECTIONS_START" }
  | {
      type: "SUBMIT_CORRECTIONS_SUCCESS";
      /** Process result with category/categorySource updated from userCategories. */
      patched: ProcessResult;
    }
  | { type: "SUBMIT_CORRECTIONS_ERROR"; message: string }
  | { type: "CALCULATE_INFLATION_START" }
  | {
      type: "CALCULATE_INFLATION_SUCCESS";
      calculation: InflationCalculation;
      meta: InflationMeta;
    }
  | { type: "CALCULATE_INFLATION_ERROR"; message: string }
  | { type: "TOGGLE_EXCLUSION"; transactionId: string }
  | { type: "RESET" };

/** Initial state of a brand-new wizard session. */
export const INITIAL_STATE: WizardState = {
  step: "bank",
  bank: null,
  uploadedFile: null,
  processResult: null,
  loading: false,
  error: null,
  suggestionsLoading: false,
  suggestions: null,
  userCategories: {},
  suggestionsFallback: false,
  submitting: false,
  calculating: false,
  inflationCalculation: null,
  inflationMeta: null,
  excludedTransactionIds: new Set<string>(),
};
