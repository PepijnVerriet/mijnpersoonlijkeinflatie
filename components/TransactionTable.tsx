import type { CategorizedTransaction } from "@/lib/types";

interface TransactionTableProps {
  transactions: CategorizedTransaction[];
}

/** Toont de ingelezen transacties met hun COICOP-categorie. */
export function TransactionTable(_props: TransactionTableProps) {
  // TODO: render a table of transactions with editable categories.
  return null;
}
