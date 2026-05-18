import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/cbs/route";
import { USER_FACING_CATEGORY_CODES } from "@/lib/cbs/categories";

function makeRequest(query: string): Request {
  return new Request(`http://localhost/api/cbs${query}`);
}

describe("GET /api/cbs", () => {
  it("returns 200 with all thirteen user-facing rates for a known month", async () => {
    const res = await GET(makeRequest("?month=2025-04"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      month: string;
      rates: Record<string, number>;
    };
    expect(body.month).toBe("2025-04");
    expect(Object.keys(body.rates).sort()).toEqual(
      [...USER_FACING_CATEGORY_CODES].sort(),
    );
  });

  it("sets a 24h public Cache-Control header on success", async () => {
    const res = await GET(makeRequest("?month=2025-04"));
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=86400");
  });

  it("returns 400 when month is missing", async () => {
    const res = await GET(makeRequest(""));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/month/i);
  });

  it("returns 400 when month is malformed", async () => {
    const res = await GET(makeRequest("?month=2025-13"));
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-YYYY-MM input", async () => {
    const res = await GET(makeRequest("?month=april"));
    expect(res.status).toBe(400);
  });

  it("returns 404 for a well-formed but unknown month", async () => {
    const res = await GET(makeRequest("?month=2099-12"));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/2099-12/);
  });
});
