import { describe, expect, it } from "vitest";

import { wizardReducer } from "@/lib/wizard/reducer";
import {
  INITIAL_STATE,
  type ProcessResult,
  type WizardAction,
  type WizardState,
} from "@/lib/wizard/types";

/** Build a state with one transaction excluded, for the reset-tests. */
function stateWithExclusions(ids: string[]): WizardState {
  let s: WizardState = INITIAL_STATE;
  for (const id of ids) {
    s = wizardReducer(s, { type: "TOGGLE_EXCLUSION", transactionId: id });
  }
  return s;
}

const PROCESS_RESULT: ProcessResult = {
  bank: "rabobank",
  transactionCount: 0,
  categorizedCount: 0,
  unknownCount: 0,
  transactions: [],
};

describe("wizardReducer — TOGGLE_EXCLUSION", () => {
  it("INITIAL_STATE has an empty excludedTransactionIds set", () => {
    expect(INITIAL_STATE.excludedTransactionIds).toBeInstanceOf(Set);
    expect(INITIAL_STATE.excludedTransactionIds.size).toBe(0);
  });

  it("adds an unknown id and returns a fresh Set instance", () => {
    const next = wizardReducer(INITIAL_STATE, {
      type: "TOGGLE_EXCLUSION",
      transactionId: "tx-1",
    });
    expect(next.excludedTransactionIds.has("tx-1")).toBe(true);
    expect(next.excludedTransactionIds.size).toBe(1);
    // Fresh reference — React must be able to detect the state change.
    expect(next.excludedTransactionIds).not.toBe(
      INITIAL_STATE.excludedTransactionIds,
    );
    // Original Set was not mutated.
    expect(INITIAL_STATE.excludedTransactionIds.size).toBe(0);
  });

  it("toggling an already-excluded id removes it (also fresh Set)", () => {
    const added = wizardReducer(INITIAL_STATE, {
      type: "TOGGLE_EXCLUSION",
      transactionId: "tx-1",
    });
    const removed = wizardReducer(added, {
      type: "TOGGLE_EXCLUSION",
      transactionId: "tx-1",
    });
    expect(removed.excludedTransactionIds.has("tx-1")).toBe(false);
    expect(removed.excludedTransactionIds.size).toBe(0);
    expect(removed.excludedTransactionIds).not.toBe(added.excludedTransactionIds);
  });

  it("RESET and PROCESS_SUCCESS both wipe excludedTransactionIds", () => {
    const dirty = stateWithExclusions(["tx-1", "tx-2", "tx-3"]);
    expect(dirty.excludedTransactionIds.size).toBe(3);

    const afterReset = wizardReducer(dirty, { type: "RESET" } as WizardAction);
    expect(afterReset.excludedTransactionIds.size).toBe(0);

    const afterProcess = wizardReducer(dirty, {
      type: "PROCESS_SUCCESS",
      result: PROCESS_RESULT,
    });
    expect(afterProcess.excludedTransactionIds.size).toBe(0);
  });

  // -------------------------------------------------------------------
  // Module 6b-6: end-to-end state-machine flow
  // -------------------------------------------------------------------

  it("(6b-6) exclusions survive SUBMIT_CORRECTIONS_SUCCESS so 6b-4 can use them", () => {
    // Sequence: process → toggle 2 ids → submit corrections.
    // The submit must NOT clear the exclusion set, otherwise the calculate
    // call right after would lose the user's choices (design from 6b-1).
    let s: WizardState = INITIAL_STATE;
    s = wizardReducer(s, { type: "PROCESS_SUCCESS", result: PROCESS_RESULT });
    s = wizardReducer(s, { type: "TOGGLE_EXCLUSION", transactionId: "tx-1" });
    s = wizardReducer(s, { type: "TOGGLE_EXCLUSION", transactionId: "tx-2" });
    expect(s.excludedTransactionIds.size).toBe(2);

    s = wizardReducer(s, {
      type: "SUBMIT_CORRECTIONS_SUCCESS",
      patched: PROCESS_RESULT,
    });
    expect(s.excludedTransactionIds.has("tx-1")).toBe(true);
    expect(s.excludedTransactionIds.has("tx-2")).toBe(true);
    expect(s.excludedTransactionIds.size).toBe(2);
    expect(s.step).toBe("result");
  });
});
