import type { BankParser } from "./types";
import { rabobankParser } from "./rabobank";

/** Registry of all available bank parsers. Add new banks here. */
export const parsers: readonly BankParser[] = [rabobankParser];

/** Return the first parser that recognizes the given CSV text, or null. */
export function detectParser(_csv: string): BankParser | null {
  throw new Error("Not implemented");
}

export type { BankParser } from "./types";
export { rabobankParser } from "./rabobank";
