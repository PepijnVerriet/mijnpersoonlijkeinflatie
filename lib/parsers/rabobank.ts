/**
 * Rabobank PDF statement parser (module 4a).
 *
 * Reads a multi-page Rabobank "Rekeningafschrift" PDF and returns the consumer
 * expenses it contains as {@link Transaction}s. The work is split across small,
 * independently testable helpers in `lib/parsers/rabobank/`:
 *
 *   pdf-text.ts    PDF -> positioned text lines
 *   header.ts      header -> statement date / year / own IBAN / account holder
 *   blocks.ts      text lines -> raw transaction blocks
 *   transaction.ts raw block -> typed Transaction
 *   merchant.ts    merchant-name normalization + location extraction
 *   filter.ts      keep only consumer expenses
 */
import type { Transaction } from "@/lib/parsers/types";
import { splitTransactionBlocks } from "./rabobank/blocks";
import { isConsumerExpense } from "./rabobank/filter";
import { parseStatementHeader } from "./rabobank/header";
import { extractTextLines } from "./rabobank/pdf-text";
import { blockToTransaction } from "./rabobank/transaction";

/**
 * Parse a Rabobank account-statement PDF.
 *
 * @param buffer The raw PDF file contents.
 * @returns The consumer-expense transactions in the statement, in statement
 *          order (income, internal transfers and brokerage cash orders removed).
 */
export async function parseRabobankPdf(buffer: Buffer): Promise<Transaction[]> {
  const lines = await extractTextLines(buffer);
  const header = parseStatementHeader(lines);
  const blocks = splitTransactionBlocks(lines);

  return blocks
    .map((block) => blockToTransaction(block, header))
    .filter((tx) => isConsumerExpense(tx, header.accountHolderName));
}
