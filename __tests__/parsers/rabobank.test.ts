// @ts-nocheck -- test runner (Jest/Vitest) not configured yet.
import { rabobankParser } from "@/lib/parsers/rabobank";

describe("rabobankParser", () => {
  it.todo("recognizes a Rabobank CSV export via canParse()");
  it.todo("parses rows into a Transaction[]");
  it.todo("maps debit/credit columns to a signed amount");
  it.todo("normalizes the date to YYYY-MM-DD");
  it.todo("throws on malformed input");
});
