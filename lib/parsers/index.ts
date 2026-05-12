/**
 * Bank parser registry.
 *
 * Per CLAUDE.md, each parser accepts bank-specific input and returns a uniform
 * `Transaction[]`. The abstract contract is:
 *
 *   parse(input: File | Buffer): Promise<Transaction[]>
 *
 * v1 ships only the Rabobank PDF parser.
 */
import type { Transaction } from "./types";
import { parseRabobankPdf } from "./rabobank";

export interface BankParser {
  /** Stable identifier. */
  readonly id: string;
  /** Human-readable bank name for the UI. */
  readonly name: string;
  /** Parse a statement file (PDF / CSV / XML, depending on the bank). */
  parse(input: File | Buffer): Promise<Transaction[]>;
}

/** Adapt a Buffer-based parser so it also accepts a browser `File`. */
async function toBuffer(input: File | Buffer): Promise<Buffer> {
  if (Buffer.isBuffer(input)) return input;
  return Buffer.from(await input.arrayBuffer());
}

export const rabobankParser: BankParser = {
  id: "rabobank",
  name: "Rabobank",
  async parse(input: File | Buffer): Promise<Transaction[]> {
    return parseRabobankPdf(await toBuffer(input));
  },
};

/** All available bank parsers. Add new banks here. */
export const parsers: readonly BankParser[] = [rabobankParser];

export { parseRabobankPdf } from "./rabobank";
export type { Transaction } from "./types";
