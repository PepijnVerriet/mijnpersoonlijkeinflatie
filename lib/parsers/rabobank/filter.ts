/**
 * Filtering of parsed transactions down to actual consumer expenses,
 * implementing the CLAUDE.md principle "alleen uitgaven".
 *
 * Excluded:
 *  - income (anything in the credit column);
 *  - internal transfers between the user's own accounts (code `tb` with
 *    "Sparen/beleggen", or any transfer whose counterparty carries the
 *    account holder's own name);
 *  - cash orders to brokerage accounts such as Flatex Bank AG (these use the
 *    `id` code but are not consumption — recognized by "Flatex"/"CASHORDER").
 */
import type { Transaction } from "@/lib/parsers/types";

const SAVINGS_RE = /sparen\s*\/\s*beleggen/i;
const BROKERAGE_RE = /\bflatex\b|\bcashorder\b/i;

/** Whether a parsed transaction is a consumer expense that should be kept. */
export function isConsumerExpense(
  tx: Transaction,
  accountHolderName: string,
): boolean {
  if (tx.type === "credit") return false;
  if (isOwnAccountTransfer(tx, accountHolderName)) return false;
  if (BROKERAGE_RE.test(tx.description)) return false;
  return true;
}

/** Whether `tx` is a transfer between the user's own accounts. */
export function isOwnAccountTransfer(
  tx: Transaction,
  accountHolderName: string,
): boolean {
  if (tx.code === "tb" && SAVINGS_RE.test(tx.description)) return true;
  if (namesMatch(tx.counterpartyName, accountHolderName)) return true;
  return false;
}

/** Loose name comparison: case- and punctuation-insensitive. */
export function namesMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const na = norm(a);
  const nb = norm(b);
  return na.length > 0 && na === nb;
}
