/**
 * Shared domain types used across modules.
 *
 * The canonical `Transaction` type lives in `lib/parsers/types.ts` (it is the
 * output contract of every bank parser); it is re-exported here for convenience.
 */

export type { Transaction } from "@/lib/parsers/types";
import type { Transaction } from "@/lib/parsers/types";

/** Identifier for a supported bank. */
export type BankId = "rabobank" | "ing" | "abnamro";

/**
 * COICOP top-level division codes (CBS COICOP-2018 schema, NL-specifiek).
 *
 * Codes 01-13 are the CBS-published COICOP-2018 divisions used by table
 * 86141NED. Code 14 is a project-internal "system" category for taxes and
 * non-consumption transfers that get filtered out before inflation maths;
 * it has no CBS counterpart (see lib/cbs/coicop-mapping.ts).
 */
export type CoicopCode =
  | "01" // Food and non-alcoholic beverages
  | "02" // Alcoholic beverages and tobacco
  | "03" // Clothing and footwear
  | "04" // Housing and utilities
  | "05" // Household goods and services
  | "06" // Health
  | "07" // Transport
  | "08" // Information and communication (COICOP-2018, new)
  | "09" // Recreation, sport and culture
  | "10" // Education
  | "11" // Restaurants and accommodation
  | "12" // Insurance and financial services (COICOP-2018, new)
  | "13" // Miscellaneous goods and services (was COICOP-99 code 12)
  | "14"; // Taxes (system-only, filtered out — no CBS counterpart)

/** A COICOP category with English and Dutch labels. */
export interface CoicopCategory {
  code: CoicopCode;
  /** English label (for code/comments). */
  label: string;
  /** Dutch label (for the UI). */
  labelNl: string;
}

/** A transaction after the categorizer has run. */
export interface CategorizedTransaction extends Transaction {
  /** Assigned COICOP code, or null if it could not be categorized. */
  coicop: CoicopCode | null;
  /** Confidence of the assignment, 0..1. */
  confidence: number;
}

/** Static list of COICOP top-level categories. */
export const COICOP_CATEGORIES: readonly CoicopCategory[] = [
  // TODO: fill in label / labelNl for every CoicopCode.
];
