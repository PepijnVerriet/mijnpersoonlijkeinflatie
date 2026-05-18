import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/calculate/route";
import type { CalculateResponse } from "@/app/api/calculate/route";
import type { CategoryCode } from "@/lib/cbs/types";

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/calculate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function withIds<T extends { id: string }>(items: T[], prefix: string): T[] {
  return items.map((t, i) => ({ ...t, id: `${prefix}-${i}` }));
}

interface WireTx {
  id: string;
  date: string;
  amount: number;
  merchant: string | null;
  description: string;
  category: CategoryCode | null;
}

function makeBulk(
  n: number,
  category: CategoryCode,
  perAmount: number,
  date = "2025-04-15T12:00:00.000Z",
): WireTx[] {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i),
    date,
    amount: perAmount,
    merchant: `Merchant ${i}`,
    description: `desc ${i}`,
    category,
  }));
}

describe("POST /api/calculate", () => {
  it("returns 200 with a complete InflationCalculation for valid input", async () => {
    const txs = [
      ...makeBulk(15, "01", 10), // €150 cat 01
      ...makeBulk(5, "11", 20), // €100 cat 11
    ];
    const res = await POST(buildRequest({ transactions: txs }));
    expect(res.status).toBe(200);

    const body = (await res.json()) as CalculateResponse;
    expect(body.calculation.totalSpending).toBeCloseTo(250, 6);
    expect(body.calculation.breakdown.length).toBe(2);
    expect(body.calculation.monthsIncluded).toEqual(["2025-04"]);
    expect(body.meta.usingMockData).toBe(true);
    expect(body.meta.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns 422 with InsufficientDataError when too few transactions are categorised", async () => {
    const txs = makeBulk(5, "01", 10);
    const res = await POST(buildRequest({ transactions: txs }));
    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Te weinig data/);
  });

  it("returns 422 when every transaction is uncategorised", async () => {
    const txs = makeBulk(30, "01", 10).map((t) => ({ ...t, category: null }));
    const res = await POST(buildRequest({ transactions: txs }));
    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Geen transacties/);
  });

  it("returns 400 when `transactions` is missing", async () => {
    const res = await POST(buildRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when a transaction has an invalid shape", async () => {
    const res = await POST(
      buildRequest({
        transactions: [{ id: "a", date: 123, amount: "x" }],
      }),
    );
    expect(res.status).toBe(400);
  });

  it("respects categories without CBS data (puts them in spendingWithoutCbsData)", async () => {
    // The mock CBS data covers 2024-01..2025-04. A 2099-01 date forces a
    // category to land in the CBS-missing bucket while keeping its spending
    // visible in totalSpending.
    const future = "2099-01-15T12:00:00.000Z";
    const txs = [
      ...makeBulk(20, "01", 10, future),
    ];
    const res = await POST(buildRequest({ transactions: txs }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as CalculateResponse;
    expect(body.calculation.categoriesWithoutCbsData).toEqual(["01"]);
    expect(body.calculation.spendingWithoutCbsData).toBeCloseTo(200, 6);
  });

  // ---------------------------------------------------------------------
  // Module 6b-4: server-side filtering on excludedTransactionIds
  // ---------------------------------------------------------------------

  it("(6b-4) excluded transactions do not contribute to totalSpending", async () => {
    // Same shape as the happy-path test: 15 cat 01 × €10 + 5 cat 11 × €20 = €250.
    // Exclude 2 cat 11 × €20 → totalSpending should drop to €210.
    // DEFAULT_MIN_TRANSACTIONS = 20, so we need 22+ before exclusion to
    // safely test exclusion-of-some without tripping InsufficientDataError.
    const cat01 = withIds(makeBulk(25, "01", 10), "a");
    const cat11 = withIds(makeBulk(5, "11", 20), "b");
    const txs = [...cat01, ...cat11];
    const res = await POST(
      buildRequest({
        transactions: txs,
        excludedTransactionIds: ["b-0", "b-1"],
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as CalculateResponse;
    // 25*10 + 5*20 = 350; exclude 2*20 = 40 → 310 remain.
    expect(body.calculation.totalSpending).toBeCloseTo(310, 6);
  });

  it("(6b-4) populates meta.excludedCount and meta.excludedAmount correctly", async () => {
    // DEFAULT_MIN_TRANSACTIONS = 20, so we need 22+ before exclusion to
    // safely test exclusion-of-some without tripping InsufficientDataError.
    const cat01 = withIds(makeBulk(25, "01", 10), "a");
    const cat11 = withIds(makeBulk(5, "11", 20), "b");
    const txs = [...cat01, ...cat11];
    const res = await POST(
      buildRequest({
        transactions: txs,
        excludedTransactionIds: ["b-0", "b-1"],
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as CalculateResponse;
    expect(body.meta.excludedCount).toBe(2);
    expect(body.meta.excludedAmount).toBeCloseTo(40, 6);
  });

  it("(6b-4) empty/missing excludedTransactionIds is backwards-compatible", async () => {
    // DEFAULT_MIN_TRANSACTIONS = 20, so we need 22+ before exclusion to
    // safely test exclusion-of-some without tripping InsufficientDataError.
    const cat01 = withIds(makeBulk(25, "01", 10), "a");
    const cat11 = withIds(makeBulk(5, "11", 20), "b");
    const txs = [...cat01, ...cat11];
    const res = await POST(buildRequest({ transactions: txs }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as CalculateResponse;
    expect(body.meta.excludedCount).toBe(0);
    expect(body.meta.excludedAmount).toBe(0);
    expect(body.calculation.totalSpending).toBeCloseTo(350, 6);
  });

  it("(6b-4) phantom IDs in excludedTransactionIds are silently ignored", async () => {
    // DEFAULT_MIN_TRANSACTIONS = 20, so we need 22+ before exclusion to
    // safely test exclusion-of-some without tripping InsufficientDataError.
    const cat01 = withIds(makeBulk(25, "01", 10), "a");
    const cat11 = withIds(makeBulk(5, "11", 20), "b");
    const txs = [...cat01, ...cat11];
    const res = await POST(
      buildRequest({
        transactions: txs,
        excludedTransactionIds: ["ghost-1", "does-not-exist"],
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as CalculateResponse;
    expect(body.meta.excludedCount).toBe(0);
    expect(body.meta.excludedAmount).toBe(0);
    expect(body.calculation.totalSpending).toBeCloseTo(350, 6);
  });

  it("(6b-4) excluding every transaction returns 422 InsufficientDataError", async () => {
    // DEFAULT_MIN_TRANSACTIONS = 20, so we need 22+ before exclusion to
    // safely test exclusion-of-some without tripping InsufficientDataError.
    const cat01 = withIds(makeBulk(25, "01", 10), "a");
    const cat11 = withIds(makeBulk(5, "11", 20), "b");
    const txs = [...cat01, ...cat11];
    const res = await POST(
      buildRequest({
        transactions: txs,
        excludedTransactionIds: txs.map((t) => t.id),
      }),
    );
    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/(Geen transacties|Te weinig data)/);
  });

  // ---------------------------------------------------------------------
  // Module 6b-6: end-to-end exclusion-flow assertions
  // ---------------------------------------------------------------------

  it("(6b-6) excluding a single transaction reports its exact amount", async () => {
    // Build enough volume to clear DEFAULT_MIN_TRANSACTIONS = 20 after the
    // exclusion, then drop one €123,45 row and check excludedAmount is exact.
    const cat01 = withIds(makeBulk(21, "01", 10), "a");
    const cat11 = withIds(makeBulk(5, "11", 123.45), "b");
    const txs = [...cat01, ...cat11];
    const res = await POST(
      buildRequest({
        transactions: txs,
        excludedTransactionIds: ["b-0"],
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as CalculateResponse;
    expect(body.meta.excludedCount).toBe(1);
    expect(body.meta.excludedAmount).toBeCloseTo(123.45, 6);
  });

  it("(6b-6) excluding every transaction of a category removes it from the breakdown", async () => {
    // 25 cat 01 × €10 + 5 cat 11 × €20 = €250 + €100 = €350.
    // Drop the entire cat-11 subset → totalSpending €250, cat 11 gone.
    const cat01 = withIds(makeBulk(25, "01", 10), "a");
    const cat11 = withIds(makeBulk(5, "11", 20), "b");
    const txs = [...cat01, ...cat11];
    const res = await POST(
      buildRequest({
        transactions: txs,
        excludedTransactionIds: cat11.map((t) => t.id),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as CalculateResponse;
    expect(body.calculation.totalSpending).toBeCloseTo(250, 6);
    const cat11Entry = body.calculation.breakdown.find(
      (b) => b.category === "11",
    );
    expect(cat11Entry).toBeUndefined();
    const cat01Entry = body.calculation.breakdown.find(
      (b) => b.category === "01",
    );
    expect(cat01Entry).toBeDefined();
    expect(cat01Entry!.weight).toBeCloseTo(1, 6);
  });
});
