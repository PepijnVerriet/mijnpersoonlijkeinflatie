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
/** Captures the destination/source phrase at the tail of a description. */
const TRANSFER_DIRECTION_RE = /\b(?:naar|van):\s*(.+?)\s*$/i;

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
 * account holder's name. Inside the `tb` branch we then match on:
 *  - counterparty name == account holder (handles incoming pocket transfers
 *    where Rabo prints the user's own name);
 *  - the legacy "Sparen/beleggen" description label as a belt-and-suspenders
 *    fallback;
 *  - the savings-pocket echo pattern "<Label> naar: <Label>" / "<Label> van:
 *    <Label>", which is how Rabo prints outgoing transfers to a named pocket
 *    on the user's savings account (e.g. "Schotland", "Vrij Spaargeld").
 */
export function isOwnAccountTransfer(
  tx: Transaction,
  accountHolderName: string,
): boolean {
  if (tx.code !== "tb") return false;
  if (namesMatch(tx.counterpartyName, accountHolderName)) return true;
  if (SAVINGS_RE.test(tx.description)) return true;
  if (isPocketLabelEcho(tx)) return true;
  return false;
}

/**
 * Whether the description tail names the same party as `counterpartyName`.
 *
 * Outgoing Rabobank pocket transfers print as `"<IBAN> <Label> naar: <Label>"`
 * where `<Label>` is the user-chosen savings-pocket name and is identical on
 * both sides. The tautology is the distinguishing signal: a real third-party
 * transfer never echoes its counterparty name in a `naar:` / `van:` suffix.
 * Content-free (no hardcoded pocket labels), gated above by `code === "tb"`.
 */
function isPocketLabelEcho(tx: Transaction): boolean {
  if (!tx.counterpartyName) return false;
  const m = tx.description.match(TRANSFER_DIRECTION_RE);
  if (!m) return false;
  return namesMatch(m[1], tx.counterpartyName);
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
