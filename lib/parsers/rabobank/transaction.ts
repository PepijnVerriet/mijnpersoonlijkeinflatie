/**
 * Conversion of a raw transaction block into a typed {@link Transaction}.
 */
import type {
  RawTransactionBlock,
  StatementHeader,
  Transaction,
} from "@/lib/parsers/types";
import { extractLocation, normalizeMerchant } from "./merchant";

/** A counterparty IBAN at the start of the description field. */
const LEADING_IBAN_RE = /^([A-Z]{2}\d{2}\s[A-Z]{4}\s\d{4}\s\d{4}\s\d{2})\s*(.*)$/;
/** Phrases that introduce a transfer direction / channel after the name. */
const NAME_SUFFIX_RE = /\s+(?:via\s|naar:\s?|van:\s?|t\.?n\.?v\.?:?\s).*$/i;
/** A trailing run of reference digits (and anything after it). */
const TRAILING_REFERENCE_RE = /\s+\d{6,}.*$/;

/** Parse a printed amount ("2.030,61") into a number (2030.61). */
export function parseAmount(amountText: string): number {
  const normalized = amountText.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    throw new Error(`Rabobank parser: cannot parse amount "${amountText}"`);
  }
  return value;
}

/**
 * Combine a "DD-MM" value date with the statement's year, correcting for the
 * December/January boundary (a December date on a January statement belongs to
 * the previous year).
 */
export function combineDate(dateText: string, header: StatementHeader): Date {
  const m = dateText.match(/^(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`Rabobank parser: cannot parse date "${dateText}"`);
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = header.year;
  if (month - (header.statementDate.getMonth() + 1) > 6) year -= 1;
  return new Date(year, month - 1, day);
}

/** Split the description field's first line into a counterparty IBAN + name. */
export function parseCounterparty(firstFieldLine: string | undefined): {
  iban: string | null;
  name: string | null;
} {
  if (!firstFieldLine) return { iban: null, name: null };
  const m = firstFieldLine.match(LEADING_IBAN_RE);
  if (!m) return { iban: null, name: null };
  const iban = m[1];
  let name = m[2].trim();
  name = name.replace(NAME_SUFFIX_RE, "").trim();
  name = name.replace(TRAILING_REFERENCE_RE, "").trim();
  return { iban, name: name.length > 0 ? name : null };
}

/** Convert one raw block into a {@link Transaction}. */
export function blockToTransaction(
  block: RawTransactionBlock,
  header: StatementHeader,
): Transaction {
  const { iban, name } = parseCounterparty(block.fieldLines[0]);
  const isCardPayment = iban === null;
  const description = block.fieldLines.join(" ").replace(/\s+/g, " ").trim();

  return {
    date: combineDate(block.dateText, header),
    amount: parseAmount(block.amountText),
    type: block.column,
    code: block.code,
    counterpartyIban: iban,
    counterpartyName: name,
    description,
    merchant: isCardPayment ? normalizeMerchant(block.fieldLines[0]) : null,
    location: extractLocation(block.fieldLines),
    rawText: block.rawText,
  };
}