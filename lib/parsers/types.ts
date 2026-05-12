import type { BankId, Transaction } from "@/lib/types";

/**
 * Parses a single bank's CSV export into normalized transactions.
 *
 * Parsers are interchangeable: adding a new bank means adding a new file that
 * implements this interface and registering it in `lib/parsers/index.ts`.
 */
export interface BankParser {
  /** Stable identifier; also used as `Transaction.bank`. */
  readonly id: BankId;
  /** Human-readable bank name for the UI. */
  readonly name: string;
  /** Cheap heuristic: does this CSV look like an export from this bank? */
  canParse(csv: string): boolean;
  /** Parse the full CSV text into transactions. Throws on malformed input. */
  parse(csv: string): Transaction[];
}
