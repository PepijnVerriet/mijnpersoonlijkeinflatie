/**
 * Filtering of parsed transactions down to actual consumer expenses,
 * implementing the CLAUDE.md principle "alleen uitgaven".
 *
 * Excluded:
 *  - income (anything in the credit column);
 *  - internal transfers between the user's own accounts (only when the
 *    Rabobank transaction code is `tb`, gated either by a matching
 *    counterparty name or by the label "Sparen/beleggen");
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

/**
 * Whether `tx` is a transfer between the user's own accounts.
 *
 * Strict `code === "tb"` gate first: per Rabobank conventions only the `tb`
 * transaction code is reserved for inter-own-account transfers, so we won't
 * mistakenly drop a real card payment to someone who happens to share the
 * account holder's name. Inside the `tb` branch we then match on either:
 *  - counterparty name == account holder (handles "Schotland", "Vrij
 *    Spaargeld" and other savings-pot labels);
 *  - or the legacy "Sparen/beleggen" description label as a belt-and-
 *    suspenders fallback (in case the counterparty name happens to be the
 *    bank-side product instead of the user).
 */
export function isOwnAccountTransfer(
  tx: Transaction,
  accountHolderName: string,
): boolean {
  if (tx.code !== "tb") return false;
  if (namesMatch(tx.counterpartyName, accountHolderName)) return true;
  if (SAVINGS_RE.test(tx.description)) return true;
  return false;
}

/**
 * Loose name comparison: token-set match, case- and punctuation-insensitive.
 *
 * Splits both strings on any non-alphanumeric run, lowercases each token,
 * then compares the resulting sets. Order, punctuation and whitespace are
 * therefore irrelevant:
 *
 *   namesMatch("P.G. Verriet", "P G Verriet")    // true
 *   namesMatch("P.G. Verriet", "Verriet, P.G.")  // true
 *   namesMatch("P.G. Verriet", "Verriet")        // false (different size)
 *   namesMatch("Pepijn Verriet", "Pepijn Jansen") // false (different tokens)
 */
export function namesMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const tokens = (s: string): string[] =>
    s
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((t) => t.length > 0);
  const setA = new Set(tokens(a));
  const setB = new Set(tokens(b));
  if (setA.size === 0 || setB.size === 0) return false;
  if (setA.size !== setB.size) return false;
  for (const t of setA) {
    if (!setB.has(t)) return false;
  }
  return true;
}
