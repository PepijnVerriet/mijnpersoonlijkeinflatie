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
});
