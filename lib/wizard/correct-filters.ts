import type { ProcessResult, ProcessTransaction } from "./types";

/**
 * Splits unknowns into the three buckets the Correct screen needs:
 *  - `allUnknowns` drives the rendered list (excluded ones stay visible so
 *    the user can toggle them back in without leaving the screen).
 *  - `activeUnknowns` drives the header, share-%, and progress counter —
 *    "what is still actually open".
 *  - `excludedUnknowns` powers the summary line ("X uitgesloten · €Y").
 */
export function splitUnknowns(
  result: ProcessResult,
  excludedTransactionIds: ReadonlySet<string>,
): {
  allUnknowns: ProcessTransaction[];
  activeUnknowns: ProcessTransaction[];
  excludedUnknowns: ProcessTransaction[];
} {
  const allUnknowns = result.transactions.filter((t) => t.category === null);
  const activeUnknowns: ProcessTransaction[] = [];
  const excludedUnknowns: ProcessTransaction[] = [];
  for (const t of allUnknowns) {
    if (excludedTransactionIds.has(t.id)) excludedUnknowns.push(t);
    else activeUnknowns.push(t);
  }
  return { allUnknowns, activeUnknowns, excludedUnknowns };
}
