"use client";

import type { Transaction } from "@/lib/types";

interface FileUploadProps {
  /** Called with the parsed transactions once a statement has been processed. */
  onTransactions: (transactions: Transaction[]) => void;
}

/** Laat de gebruiker een bankafschrift (CSV) uploaden. */
export function FileUpload(_props: FileUploadProps) {
  // TODO: file input, read CSV, detect parser, emit transactions.
  return null;
}
