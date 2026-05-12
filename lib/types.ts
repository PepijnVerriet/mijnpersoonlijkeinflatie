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

/** COICOP top-level division codes used by CBS for the CPI. */
export type CoicopCode =
  | "01" // Food and non-alcoholic beverages
  | "02" // Alcoholic beverages and tobacco
  | "03" // Clothing and footwear
  | "04" // Housing, water, electricity, gas and other fuels
  | "05" // Furnishings, household equipment and routine maintenance
  | "06" // Health
  | "07" // Transport
  | "08" // Communication
  | "09" // Recreation and culture
  | "10" // Education
  | "11" // Restaurants and hotels
  | "12"; // Miscellaneous goods and services

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
