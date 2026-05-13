import type { CategoryCode } from "@/lib/cbs/types";
import type { BankId } from "@/lib/types";

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
  | { type: "RESET" };

/** Initial state of a brand-new wizard session. */
export const INITIAL_STATE: WizardState = {
  step: "bank",
  bank: null,
  uploadedFile: null,
  processResult: null,
  loading: false,
  error: null,
};
