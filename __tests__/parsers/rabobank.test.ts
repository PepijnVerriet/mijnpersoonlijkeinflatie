import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

import type {
  PdfTextLine,
  RawTransactionBlock,
  StatementHeader,
  Transaction,
} from "@/lib/parsers/types";
import { parseRabobankPdf } from "@/lib/parsers/rabobank";
import {
  parseTransactionStart,
  splitTransactionBlocks,
} from "@/lib/parsers/rabobank/blocks";
import {
  isConsumerExpense,
  isOwnAccountTransfer,
  namesMatch,
} from "@/lib/parsers/rabobank/filter";
import { parseStatementHeader } from "@/lib/parsers/rabobank/header";
import { extractTextLines } from "@/lib/parsers/rabobank/pdf-text";
import { extractLocation, normalizeMerchant } from "@/lib/parsers/rabobank/merchant";
import {
  blockToTransaction,
  combineDate,
  parseAmount,
  parseCounterparty,
} from "@/lib/parsers/rabobank/transaction";

const PDF_PATH = new URL(
  "../../test-data/rabobank-2025-04.pdf",
  import.meta.url,
);
const pdfBuffer = readFileSync(PDF_PATH);

/** Build a minimal Transaction for unit tests. */
function makeTx(partial: Partial<Transaction> = {}): Transaction {
  return {
    date: new Date(2025, 3, 1),
    amount: 1,
    type: "debit",
    code: "bc",
    counterpartyIban: null,
    counterpartyName: null,
    description: "",
    merchant: null,
    location: null,
    rawText: "",
    ...partial,
  };
}

const HEADER_2025: StatementHeader = {
  statementDate: new Date(2025, 4, 1),
  year: 2025,
  iban: "NL34 RABO 0300 2179 35",
  accountHolderName: "P.G. Verriet",
};

// ---------------------------------------------------------------------------
// Integration: parse the real test statement
// ---------------------------------------------------------------------------
describe("parseRabobankPdf (integration, test-data/rabobank-2025-04.pdf)", () => {
  let transactions: Transaction[];

  beforeAll(async () => {
    transactions = await parseRabobankPdf(pdfBuffer);
  });

  it("returns only consumer expenses (debit, internal transfers removed)", () => {
    // 118 debit rows in the PDF minus 2 savings transfers and 2 Flatex cash orders.
    expect(transactions).toHaveLength(114);
    expect(transactions.every((t) => t.type === "debit")).toBe(true);
  });

  it("derives the calendar year from the statement header (2025)", () => {
    expect(transactions.every((t) => t.date.getFullYear() === 2025)).toBe(true);
  });

  it("parses the Jumbo card payment of 01-04 for 4,49", () => {
    const tx = transactions.find(
      (t) =>
        t.amount === 4.49 &&
        t.date.getTime() === new Date(2025, 3, 1).getTime() &&
        /jumbo/i.test(t.description),
    );
    expect(tx).toBeDefined();
    expect(tx!.code).toBe("bc");
    expect(tx!.type).toBe("debit");
    expect(tx!.merchant).toBe("Jumbo");
    expect(tx!.location).toBe("TILBURG");
    expect(tx!.counterpartyIban).toBeNull();
  });

  it("parses the Shell card payment of 01-04 for 13,00", () => {
    const tx = transactions.find(
      (t) =>
        t.amount === 13 &&
        t.date.getTime() === new Date(2025, 3, 1).getTime() &&
        /shell/i.test(t.description),
    );
    expect(tx).toBeDefined();
    expect(tx!.code).toBe("bc");
    expect(tx!.merchant).toContain("Shell");
  });

  it("parses the KPN direct debit of 23-04 for 52,50", () => {
    const tx = transactions.find(
      (t) => t.amount === 52.5 && /kpn/i.test(t.description),
    );
    expect(tx).toBeDefined();
    expect(tx!.code).toBe("ei");
    expect(tx!.date.getTime()).toBe(new Date(2025, 3, 23).getTime());
    expect(tx!.counterpartyIban).toBe("NL41 INGB 0000 4675 98");
    expect(tx!.counterpartyName).toBe("KPN B.V.");
  });

  it("excludes internal savings transfers (code tb, 'Sparen/beleggen')", () => {
    expect(transactions.some((t) => /sparen\s*\/\s*beleggen/i.test(t.description))).toBe(
      false,
    );
    expect(transactions.some((t) => t.code === "tb")).toBe(false);
  });

  it("excludes salary and student finance (credit column)", () => {
    expect(transactions.some((t) => t.code === "sb")).toBe(false);
    expect(transactions.some((t) => /salaris/i.test(t.description))).toBe(false);
    expect(transactions.some((t) => /\bDUO\b/.test(t.description))).toBe(false);
  });

  it("excludes brokerage cash orders (Flatex / CASHORDER)", () => {
    expect(transactions.some((t) => /flatex|cashorder/i.test(t.description))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Header parsing
// ---------------------------------------------------------------------------
describe("parseStatementHeader", () => {
  let lines: PdfTextLine[];
  beforeAll(async () => {
    lines = await extractTextLines(pdfBuffer);
  });

  it("reads the statement date, year, own IBAN and account holder name", () => {
    const header = parseStatementHeader(lines);
    expect(header.statementDate.getTime()).toBe(new Date(2025, 4, 1).getTime());
    expect(header.year).toBe(2025);
    expect(header.iban).toBe("NL34 RABO 0300 2179 35");
    expect(header.accountHolderName).toBe("P.G. Verriet");
  });
});

// ---------------------------------------------------------------------------
// Block splitting
// ---------------------------------------------------------------------------
describe("splitTransactionBlocks", () => {
  let lines: PdfTextLine[];
  beforeAll(async () => {
    lines = await extractTextLines(pdfBuffer);
  });

  it("finds every transaction row in the statement (118 debit + 44 credit)", () => {
    const blocks = splitTransactionBlocks(lines);
    expect(blocks).toHaveLength(162);
    expect(blocks.filter((b) => b.column === "debit")).toHaveLength(118);
    expect(blocks.filter((b) => b.column === "credit")).toHaveLength(44);
  });

  it("parses the first block (the 01-04 'cb' credit of 5,00)", () => {
    const [first] = splitTransactionBlocks(lines);
    expect(first.dateText).toBe("01-04");
    expect(first.code).toBe("cb");
    expect(first.amountText).toBe("5,00");
    expect(first.column).toBe("credit");
    expect(first.fieldLines[0]).toContain("NL90 INGB 0001 5100 48");
  });

  it("parseTransactionStart ignores non-transaction lines", () => {
    const headerLine = lines.find((l) => /Datum afschrift/i.test(l.text))!;
    expect(parseTransactionStart(headerLine)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Block -> Transaction
// ---------------------------------------------------------------------------
describe("blockToTransaction", () => {
  it("converts a card-payment block", () => {
    const block: RawTransactionBlock = {
      dateText: "01-04",
      code: "bc",
      amountText: "4,49",
      column: "debit",
      fieldLines: [
        "Jumbo 199730",
        "TILBURG, 5021LG, NLD, 17:36",
        ". Pas: 6xxxx5027 pasnr. 026 Terminal: 3GFF30. Appr Cd: 708G02 Apple Pay",
      ],
      rawText: "raw",
    };
    const tx = blockToTransaction(block, HEADER_2025);
    expect(tx.amount).toBe(4.49);
    expect(tx.type).toBe("debit");
    expect(tx.code).toBe("bc");
    expect(tx.date.getTime()).toBe(new Date(2025, 3, 1).getTime());
    expect(tx.counterpartyIban).toBeNull();
    expect(tx.counterpartyName).toBeNull();
    expect(tx.merchant).toBe("Jumbo");
    expect(tx.location).toBe("TILBURG");
    expect(tx.rawText).toBe("raw");
  });

  it("converts an IBAN direct-debit block", () => {
    const block: RawTransactionBlock = {
      dateText: "23-04",
      code: "ei",
      amountText: "52,50",
      column: "debit",
      fieldLines: ["NL41 INGB 0000 4675 98 KPN B.V.", "Factuur 20-04-2025"],
      rawText: "raw",
    };
    const tx = blockToTransaction(block, HEADER_2025);
    expect(tx.counterpartyIban).toBe("NL41 INGB 0000 4675 98");
    expect(tx.counterpartyName).toBe("KPN B.V.");
    expect(tx.merchant).toBeNull();
    expect(tx.amount).toBe(52.5);
  });
});

describe("parseAmount", () => {
  it("handles plain amounts", () => {
    expect(parseAmount("4,49")).toBe(4.49);
    expect(parseAmount("617,50")).toBe(617.5);
  });
  it("handles thousands separators", () => {
    expect(parseAmount("2.030,61")).toBe(2030.61);
    expect(parseAmount("5.057,70")).toBe(5057.7);
  });
});

describe("combineDate", () => {
  it("combines DD-MM with the statement year", () => {
    expect(combineDate("01-04", HEADER_2025).getTime()).toBe(
      new Date(2025, 3, 1).getTime(),
    );
  });
  it("rolls back to the previous year for December on a January statement", () => {
    const januaryHeader: StatementHeader = {
      statementDate: new Date(2025, 0, 3),
      year: 2025,
      iban: "NL00 RABO 0000 0000 00",
      accountHolderName: "X",
    };
    expect(combineDate("28-12", januaryHeader).getTime()).toBe(
      new Date(2024, 11, 28).getTime(),
    );
  });
});

describe("parseCounterparty", () => {
  it("splits IBAN and name", () => {
    expect(parseCounterparty("NL41 INGB 0000 4675 98 KPN B.V.")).toEqual({
      iban: "NL41 INGB 0000 4675 98",
      name: "KPN B.V.",
    });
  });
  it("strips 'via' / 'naar:' / 'van:' suffixes and reference numbers", () => {
    expect(parseCounterparty("NL56 RABO 0350 8016 81 C. Snijers via Rabo Betaalverzoek").name).toBe(
      "C. Snijers",
    );
    expect(parseCounterparty("NL52 RABO 3162 5744 12 P.G. Verriet van: Sparen/beleggen").name).toBe(
      "P.G. Verriet",
    );
  });
  it("returns nulls when there is no leading IBAN", () => {
    expect(parseCounterparty("Jumbo 199730")).toEqual({ iban: null, name: null });
  });
});

// ---------------------------------------------------------------------------
// Merchant / location
// ---------------------------------------------------------------------------
describe("normalizeMerchant", () => {
  it("strips trailing store numbers", () => {
    expect(normalizeMerchant("Jumbo 199730")).toBe("Jumbo");
    expect(normalizeMerchant("CIRFOOD 3041")).toBe("CIRFOOD");
  });
  it("strips PSP prefixes", () => {
    expect(normalizeMerchant("BCK*Shell Best")).toBe("Shell Best");
    expect(normalizeMerchant("CCV*Stadsherberg t Pum S")).toBe("Stadsherberg t Pum S");
  });
  it("leaves an ordinary name untouched", () => {
    expect(normalizeMerchant("AH to go -Albron")).toBe("AH to go -Albron");
  });
  it("returns null for empty input", () => {
    expect(normalizeMerchant(null)).toBeNull();
    expect(normalizeMerchant("   ")).toBeNull();
  });
});

describe("extractLocation", () => {
  it("reads the city from a card-payment location line", () => {
    expect(extractLocation(["Jumbo 199730", "TILBURG, 5021LG, NLD, 17:36"])).toBe(
      "TILBURG",
    );
    expect(
      extractLocation(["Total Nn001189 Hambake", "Den Bosch, 5231 DA, NLD, 17:05"]),
    ).toBe("Den Bosch");
  });
  it("returns null when there is no location line", () => {
    expect(extractLocation(["NL41 INGB 0000 4675 98 KPN B.V.", "Factuur 20-04"])).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------
describe("isConsumerExpense", () => {
  it("keeps an ordinary debit", () => {
    expect(isConsumerExpense(makeTx({ description: "Jumbo 199730" }), "P.G. Verriet")).toBe(
      true,
    );
  });
  it("drops income (credit column)", () => {
    expect(isConsumerExpense(makeTx({ type: "credit" }), "P.G. Verriet")).toBe(false);
  });
  it("drops internal savings transfers", () => {
    const tx = makeTx({
      code: "tb",
      description: "NL52 RABO 3162 5744 12 Sparen/beleggen naar: Sparen/beleggen",
    });
    expect(isConsumerExpense(tx, "P.G. Verriet")).toBe(false);
    expect(isOwnAccountTransfer(tx, "P.G. Verriet")).toBe(true);
  });
  it("drops tb transfers to an account in the user's own name", () => {
    expect(
      isConsumerExpense(
        makeTx({ code: "tb", counterpartyName: "P. G. Verriet" }),
        "P.G. Verriet",
      ),
    ).toBe(false);
  });
  it("drops tb 'Schotland' savings-pot transfers to the user's own account", () => {
    const tx = makeTx({
      code: "tb",
      counterpartyName: "P.G. Verriet",
      description: "NL08 RABO 3162 5742 34 P.G. Verriet Schotland",
    });
    expect(isConsumerExpense(tx, "P.G. Verriet")).toBe(false);
    expect(isOwnAccountTransfer(tx, "P.G. Verriet")).toBe(true);
  });
  it("drops tb 'Vrij Spaargeld' transfers to the user's own account", () => {
    const tx = makeTx({
      code: "tb",
      counterpartyName: "Verriet, P.G.",
      description: "NL08 RABO 3162 5742 34 Vrij Spaargeld",
    });
    expect(isConsumerExpense(tx, "P.G. Verriet")).toBe(false);
    expect(isOwnAccountTransfer(tx, "P.G. Verriet")).toBe(true);
  });
  it("KEEPS a non-tb payment to a person with the same name (no false positive)", () => {
    // Card payment (code 'bc') to a friend whose name happens to match the
    // account holder — must not be mistaken for an internal transfer.
    expect(
      isConsumerExpense(
        makeTx({ code: "bc", counterpartyName: "P.G. Verriet" }),
        "P.G. Verriet",
      ),
    ).toBe(true);
  });
  it("drops brokerage cash orders (Flatex / CASHORDER)", () => {
    expect(
      isConsumerExpense(
        makeTx({ code: "id", description: "NL65 ABNA 0880 8781 18 Flatex Bank AG CASHORDER4334996" }),
        "P.G. Verriet",
      ),
    ).toBe(false);
  });

  // Module 6a: outgoing pocket-label echo pattern in the description tail.
  // Rabo prints these as "<IBAN> <Label> naar: <Label>" with the pocket name
  // as both counterpartyName and the destination phrase.
  it("(a) drops outgoing tb 'Schotland naar: Schotland' loopback (pocket-label echo)", () => {
    const tx = makeTx({
      code: "tb",
      counterpartyIban: "NL08 RABO 3162 5742 34",
      counterpartyName: "Schotland",
      description: "NL08 RABO 3162 5742 34 Schotland naar: Schotland",
    });
    expect(isOwnAccountTransfer(tx, "P.G. Verriet")).toBe(true);
    expect(isConsumerExpense(tx, "P.G. Verriet")).toBe(false);
  });

  it("(b) drops outgoing tb 'Vrij Spaargeld naar: Vrij Spaargeld' loopback (pocket-label echo)", () => {
    const tx = makeTx({
      code: "tb",
      counterpartyIban: "NL08 RABO 3162 5742 34",
      counterpartyName: "Vrij Spaargeld",
      description: "NL08 RABO 3162 5742 34 Vrij Spaargeld naar: Vrij Spaargeld",
    });
    expect(isOwnAccountTransfer(tx, "P.G. Verriet")).toBe(true);
    expect(isConsumerExpense(tx, "P.G. Verriet")).toBe(false);
  });

  it("(c) KEEPS a tb transfer to a third party with no name echo (real payment)", () => {
    // A real rent payment via internetbankieren — code 'tb' but counterparty
    // is a different person and the description has no `naar: <CP>` echo.
    const tx = makeTx({
      code: "tb",
      counterpartyIban: "NL12 ABNA 0123 4567 89",
      counterpartyName: "K. Verhuurder",
      description: "NL12 ABNA 0123 4567 89 K. Verhuurder huur april",
    });
    expect(isOwnAccountTransfer(tx, "P.G. Verriet")).toBe(false);
    expect(isConsumerExpense(tx, "P.G. Verriet")).toBe(true);
  });

  it("(d) KEEPS a non-tb (bc) payment even if description contains 'naar: <Name>'", () => {
    // The pocket-label echo heuristic only fires inside the code === 'tb'
    // gate, so a card payment whose description happens to read like an echo
    // must still be treated as a consumer expense.
    const tx = makeTx({
      code: "bc",
      counterpartyName: "Anna",
      description: "Pizza terug naar: Anna",
    });
    expect(isOwnAccountTransfer(tx, "P.G. Verriet")).toBe(false);
    expect(isConsumerExpense(tx, "P.G. Verriet")).toBe(true);
  });

  it("(e) KEEPS a tb transfer with a different name after 'naar:' (no false echo)", () => {
    // counterpartyName and the destination phrase disagree, so namesMatch
    // fails and the loopback heuristic must not fire.
    const tx = makeTx({
      code: "tb",
      counterpartyIban: "NL12 ABNA 0123 4567 89",
      counterpartyName: "Anna",
      description: "NL12 ABNA 0123 4567 89 Anna gift naar: Bob",
    });
    expect(isOwnAccountTransfer(tx, "P.G. Verriet")).toBe(false);
    expect(isConsumerExpense(tx, "P.G. Verriet")).toBe(true);
  });
});

describe("namesMatch", () => {
  it("matches case- and punctuation-insensitively", () => {
    expect(namesMatch("P.G. Verriet", "P. G. Verriet")).toBe(true);
    expect(namesMatch("KPN B.V.", "P.G. Verriet")).toBe(false);
    expect(namesMatch(null, "X")).toBe(false);
  });

  it("matches with tokens in any order ('Verriet, P.G.' ↔ 'P.G. Verriet')", () => {
    expect(namesMatch("P.G. Verriet", "Verriet, P.G.")).toBe(true);
    expect(namesMatch("Verriet, P.G.", "P G Verriet")).toBe(true);
  });

  it("does not match when token sets differ in size", () => {
    expect(namesMatch("P.G. Verriet", "Verriet")).toBe(false);
    expect(namesMatch("Verriet", "P.G. Verriet")).toBe(false);
  });

  it("does not match different surnames sharing a first initial", () => {
    expect(namesMatch("Pepijn Verriet", "Pepijn Jansen")).toBe(false);
  });

  it("returns false for empty or null inputs", () => {
    expect(namesMatch("", "P.G. Verriet")).toBe(false);
    expect(namesMatch("P.G. Verriet", "")).toBe(false);
    expect(namesMatch(null, null)).toBe(false);
  });
});
