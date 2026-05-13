import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProcessResult } from "@/lib/wizard/types";

// Hold the parser implementation so individual tests can override it.
const parseMock = vi.fn();
vi.mock("@/lib/parsers/rabobank", () => ({
  parseRabobankPdf: (buf: Buffer) => parseMock(buf),
}));

// Import the route AFTER vi.mock so the mock is applied.
const { POST } = await import("@/app/api/process/route");

const PDF_PATH = new URL(
  "../../test-data/rabobank-2025-04.pdf",
  import.meta.url,
);
const pdfBytes = readFileSync(PDF_PATH);

function buildRequest(file: File): Request {
  const form = new FormData();
  form.set("file", file);
  return new Request("http://localhost/api/process", {
    method: "POST",
    body: form,
  });
}

function fileFromBytes(bytes: Uint8Array, name = "afschrift.pdf"): File {
  return new File([bytes], name, { type: "application/pdf" });
}

beforeEach(() => {
  // Default: route uses the real parser.
  parseMock.mockImplementation(async (buf: Buffer) => {
    const actual = (await vi.importActual<typeof import("@/lib/parsers/rabobank")>(
      "@/lib/parsers/rabobank",
    )).parseRabobankPdf;
    return actual(buf);
  });
  // Force the mock AI path so we don't write to the production cache.
  delete process.env.AI_PROVIDER;
});

afterEach(() => {
  parseMock.mockReset();
});

describe("POST /api/process", () => {
  it("returns 200 with a populated ProcessResult for a real Rabobank PDF", async () => {
    const res = await POST(buildRequest(fileFromBytes(pdfBytes)));
    expect(res.status).toBe(200);

    const body = (await res.json()) as ProcessResult;
    expect(body.bank).toBe("rabobank");
    expect(body.transactionCount).toBeGreaterThan(100);
    expect(body.categorizedCount).toBeGreaterThan(80);
    expect(body.unknownCount).toBeLessThan(30);
    expect(body.transactions).toHaveLength(body.transactionCount);
    expect(body.categorizedCount + body.unknownCount).toBe(body.transactionCount);

    // Spot-check a single transaction shape.
    const tx = body.transactions[0];
    expect(typeof tx.id).toBe("string");
    expect(typeof tx.date).toBe("string");
    expect(new Date(tx.date).toString()).not.toBe("Invalid Date");
    expect(typeof tx.amount).toBe("number");
  });

  it("returns 400 when the request has no 'file' field", async () => {
    const empty = new FormData();
    const res = await POST(
      new Request("http://localhost/api/process", { method: "POST", body: empty }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for a non-PDF filename", async () => {
    const txt = new File([new TextEncoder().encode("hi")], "notes.txt", {
      type: "text/plain",
    });
    const res = await POST(buildRequest(txt));
    expect(res.status).toBe(400);
  });

  it("returns 413 when the file is over 10 MB", async () => {
    const big = new Uint8Array(10 * 1024 * 1024 + 1);
    const res = await POST(buildRequest(fileFromBytes(big)));
    expect(res.status).toBe(413);
  });

  it("returns 422 with the Rabobank hint when the parser yields zero transactions", async () => {
    parseMock.mockImplementationOnce(async () => []);
    const res = await POST(buildRequest(fileFromBytes(pdfBytes)));
    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Geen transacties gevonden/);
    expect(body.error).toMatch(/Rabobank/);
  });

  it("returns 422 with the parse-error message when the parser throws", async () => {
    parseMock.mockImplementationOnce(async () => {
      throw new Error("verwachte header niet gevonden");
    });
    const res = await POST(buildRequest(fileFromBytes(pdfBytes)));
    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Kon PDF niet lezen/);
    expect(body.error).toMatch(/verwachte header niet gevonden/);
  });
});
