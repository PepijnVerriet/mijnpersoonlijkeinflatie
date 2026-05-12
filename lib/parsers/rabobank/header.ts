/**
 * Parsing of the statement header: the "Datum afschrift" (used to derive the
 * calendar year), the account holder's own IBAN, and the account holder's name
 * (used to recognize internal transfers between the user's own accounts).
 */
import type { PdfTextLine, StatementHeader } from "@/lib/parsers/types";

/** Matches a Dutch IBAN as printed by Rabobank, e.g. "NL34 RABO 0300 2179 35". */
const IBAN_RE = /\bNL\d{2}\s[A-Z]{4}\s\d{4}\s\d{4}\s\d{2}\b/;

/** Matches "Datum afschrift 01-05-2025" (the value may be on the next line). */
const STATEMENT_DATE_RE = /\b(\d{2})-(\d{2})-(\d{4})\b/;

/** Lines in the address block that are *not* the account holder's name. */
const NON_NAME_RE =
  /^(Postbus|Internet|E-mail|Telefoon|BIC|IBAN|Bankcode|Rabobank|Rekening|BTW)\b/i;

/** A line that looks like a street ("Engstraat 15") or a postcode line. */
const ADDRESS_LINE_RE = /\d{4}\s?[A-Z]{2}\b|\d+\s*$/;

/**
 * Parse the statement header from the (full document) list of text lines.
 * Throws if the required fields cannot be found.
 */
export function parseStatementHeader(lines: PdfTextLine[]): StatementHeader {
  const firstPage = lines.filter((l) => l.page === 1);

  const statementDate = findStatementDate(firstPage);
  const iban = findOwnIban(firstPage);
  const accountHolderName = findAccountHolderName(firstPage);

  return {
    statementDate,
    year: statementDate.getFullYear(),
    iban,
    accountHolderName,
  };
}

function findStatementDate(lines: PdfTextLine[]): Date {
  const labelIdx = lines.findIndex((l) => /Datum afschrift/i.test(l.text));
  // The value sits either on the label line or on the following line.
  const candidates = labelIdx >= 0 ? [lines[labelIdx], lines[labelIdx + 1]] : lines;
  for (const line of candidates) {
    const m = line?.text.match(STATEMENT_DATE_RE);
    if (m) {
      const [, dd, mm, yyyy] = m;
      return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    }
  }
  throw new Error("Rabobank parser: could not find 'Datum afschrift' in header");
}

function findOwnIban(lines: PdfTextLine[]): string {
  for (const line of lines) {
    const m = line.text.match(IBAN_RE);
    if (m) return m[0];
  }
  throw new Error("Rabobank parser: could not find own IBAN in header");
}

function findAccountHolderName(lines: PdfTextLine[]): string {
  // The address block is on the left of the page (small x). The name is the
  // first left-column line below "Postbus ..." that is neither a known label
  // nor an address line.
  const postbusIdx = lines.findIndex((l) => /^Postbus\b/i.test(l.text));
  const start = postbusIdx >= 0 ? postbusIdx + 1 : 0;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (line.leftX > 120) continue;
    if (NON_NAME_RE.test(line.text)) continue;
    if (ADDRESS_LINE_RE.test(line.text)) continue;
    if (line.text.length < 3) continue;
    return line.text;
  }
  throw new Error("Rabobank parser: could not find account holder name in header");
}
