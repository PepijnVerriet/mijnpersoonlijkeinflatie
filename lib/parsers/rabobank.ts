import type { Transaction } from "@/lib/types";
import type { BankParser } from "./types";

/**
 * Parser for Rabobank CSV exports.
 *
 * TODO: implement CSV parsing and column mapping.
 * See `__tests__/parsers/rabobank.test.ts` for the expected behaviour.
 */
export const rabobankParser: BankParser = {
  id: "rabobank",
  name: "Rabobank",

  canParse(_csv: string): boolean {
    throw new Error("Not implemented");
  },

  parse(_csv: string): Transaction[] {
    throw new Error("Not implemented");
  },
};
