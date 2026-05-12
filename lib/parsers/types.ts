/**
 * Public output type of every bank parser plus internal helper types shared
 * between the parser sub-modules.
 *
 * Per CLAUDE.md "Bank input formats", a parser implements:
 *   parse(input: File | Buffer): Promise<Transaction[]>
 * and is responsible for its own extraction (PDF / CSV / XML).
 */

/** A single, normalized consumer expense extracted from a bank statement. */
export interface Transaction {
  /** Value date ("rentedatum"), combined with the year from the statement header. */
  date: Date;
  /** Positive amount in euros. */
  amount: number;
  /** Whether the amount was in the debit ("af") or credit ("bij") column. */
  type: "debit" | "credit";
  /** Raw two-letter Rabobank transaction code (bc, ei, id, tb, ...). */
  code: string;
  /** Counterparty IBAN, or null for card payments without an IBAN. */
  counterpartyIban: string | null;
  /** Counterparty name as printed, or null when not available. */
  counterpartyName: string | null;
  /** Full description text of the transaction (raw, joined). */
  description: string;
  /** Normalized merchant/brand name, e.g. "Jumbo" from "Jumbo 199730". */
  merchant: string | null;
  /** City/place, if present in the description. */
  location: string | null;
  /** Full raw text of the transaction block, for debugging. */
  rawText: string;
}

// ---------------------------------------------------------------------------
// Internal helper types (used by lib/parsers/rabobank/*)
// ---------------------------------------------------------------------------

/** One physical line of text extracted from the PDF, with x-positions. */
export interface PdfTextLine {
  /** 1-based page number. */
  page: number;
  /** Rounded y-coordinate (PDF user space; larger = higher on the page). */
  y: number;
  /** Text fragments on this line, left-to-right, with their x-coordinate. */
  items: { x: number; str: string }[];
  /** All fragments joined with single spaces, trimmed. */
  text: string;
  /** x-coordinate of the left-most non-empty fragment. */
  leftX: number;
}

/** Parsed statement header (one per statement, taken from the first page). */
export interface StatementHeader {
  /** "Datum afschrift", e.g. 2025-05-01. */
  statementDate: Date;
  /** Calendar year transactions belong to (derived from `statementDate`). */
  year: number;
  /** The account holder's own IBAN. */
  iban: string;
  /** The account holder's name as printed in the header. */
  accountHolderName: string;
}

/** A raw, not-yet-typed transaction block as carved out of the page text. */
export interface RawTransactionBlock {
  /** Value date as printed, "DD-MM". */
  dateText: string;
  /** Two-letter transaction code. */
  code: string;
  /** Amount as printed, e.g. "2.030,61". */
  amountText: string;
  /** Which money column the amount appeared in. */
  column: "debit" | "credit";
  /**
   * Text of the "Tegenrekening/naam/omschrijving" field, in order:
   * the first entry is the part on the code line, the rest are the
   * continuation lines below it.
   */
  fieldLines: string[];
  /** Full raw text of the block (header line + field lines). */
  rawText: string;
}
