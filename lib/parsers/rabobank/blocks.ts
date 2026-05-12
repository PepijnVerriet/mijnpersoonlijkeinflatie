/**
 * Carving the per-page transaction tables into individual transaction blocks.
 *
 * A transaction starts on a line that has the value date ("DD-MM") in the
 * left-most column and a two-letter code next to it; the "Tegenrekening /
 * omschrijving / naam" field continues on the indented lines below until the
 * next transaction starts. Page headers/footers and the code legend on the
 * last page are ignored because they match neither shape.
 */
import type { PdfTextLine, RawTransactionBlock } from "@/lib/parsers/types";

/** x-range of the value-date column. */
const DATE_COL_MAX_X = 70;
/** x-range in which the two-letter code sits. */
const CODE_COL_MIN_X = 75;
const CODE_COL_MAX_X = 105;
/** Amounts left of this x are in the debit column, right of it in the credit column. */
const AMOUNT_COLUMN_SPLIT_X = 490;
/** x-range of the indented continuation lines of the description field. */
const CONT_MIN_X = 160;
const CONT_MAX_X = 215;

const DATE_RE = /^\d{2}-\d{2}$/;
const CODE_RE = /^[a-z]{2}$/;
/** Money amount as printed: optional thousands separators, comma + 2 decimals. */
const AMOUNT_RE = /^\d{1,3}(?:\.\d{3})*,\d{2}$/;

/** Split the document's text lines into raw transaction blocks, in order. */
export function splitTransactionBlocks(lines: PdfTextLine[]): RawTransactionBlock[] {
  const blocks: RawTransactionBlock[] = [];
  let current: (RawTransactionBlock & { rawParts: string[] }) | null = null;

  const finish = () => {
    if (!current) return;
    const { rawParts, ...block } = current;
    block.rawText = rawParts.join("\n");
    blocks.push(block);
    current = null;
  };

  for (const line of lines) {
    const start = parseTransactionStart(line);
    if (start) {
      finish();
      current = {
        dateText: start.dateText,
        code: start.code,
        amountText: start.amountText,
        column: start.column,
        fieldLines: start.fieldLine ? [start.fieldLine] : [],
        rawText: "",
        rawParts: [line.text],
      };
      continue;
    }
    if (current && isContinuationLine(line)) {
      const text = continuationText(line);
      if (text) current.fieldLines.push(text);
      current.rawParts.push(line.text);
    }
  }
  finish();
  return blocks;
}

interface TransactionStart {
  dateText: string;
  code: string;
  amountText: string;
  column: "debit" | "credit";
  fieldLine: string | null;
}

/** Return the parsed start of a transaction if `line` is one, else null. */
export function parseTransactionStart(line: PdfTextLine): TransactionStart | null {
  const items = line.items;
  if (items.length < 2) return null;
  const first = items[0];
  if (first.x > DATE_COL_MAX_X || !DATE_RE.test(first.str)) return null;

  const codeItem = items.find(
    (i) => i.x >= CODE_COL_MIN_X && i.x <= CODE_COL_MAX_X && CODE_RE.test(i.str),
  );
  if (!codeItem) return null;

  // The amount is the last item that looks like a money amount.
  let amountItem: { x: number; str: string } | null = null;
  for (let i = items.length - 1; i >= 0; i--) {
    if (AMOUNT_RE.test(items[i].str)) {
      amountItem = items[i];
      break;
    }
  }
  if (!amountItem) return null;

  const fieldItems = items.filter(
    (i) => i !== first && i !== codeItem && i !== amountItem && i.x > codeItem.x,
  );
  const fieldLine = fieldItems
    .map((i) => i.str)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    dateText: first.str,
    code: codeItem.str,
    amountText: amountItem.str,
    column: amountItem.x < AMOUNT_COLUMN_SPLIT_X ? "debit" : "credit",
    fieldLine: fieldLine || null,
  };
}

/** Whether `line` is an indented continuation of the current description field. */
export function isContinuationLine(line: PdfTextLine): boolean {
  return line.leftX >= CONT_MIN_X && line.leftX <= CONT_MAX_X;
}

function continuationText(line: PdfTextLine): string {
  return line.items
    .map((i) => i.str)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
