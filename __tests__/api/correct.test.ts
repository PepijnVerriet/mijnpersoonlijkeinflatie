import { beforeEach, describe, expect, it, vi } from "vitest";

// Replace the real logger so tests don't touch the production log file.
const logMock = vi.fn();
vi.mock("@/lib/categorizer/ai/corrections-log", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/categorizer/ai/corrections-log")
  >("@/lib/categorizer/ai/corrections-log");
  return {
    ...actual,
    logUserCorrections: (entries: unknown[]) => logMock(entries),
  };
});

const { POST } = await import("@/app/api/correct/route");

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/correct", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  logMock.mockReset();
  logMock.mockImplementation(async (entries: unknown[]) => entries.length);
});

describe("POST /api/correct", () => {
  it("logs the supplied corrections and returns the count", async () => {
    const res = await POST(
      buildRequest({
        corrections: [
          {
            merchant: "bouman",
            description: "Bouman: Cafetaria Marktzicht",
            aiSuggested: "12",
            userChose: "11",
          },
          {
            merchant: null,
            description: "PayPal Luxembourg",
            aiSuggested: null,
            userChose: "12",
          },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { logged: number };
    expect(body.logged).toBe(2);

    expect(logMock).toHaveBeenCalledTimes(1);
    const entries = logMock.mock.calls[0][0] as Array<{
      description: string;
      userChose: string;
    }>;
    expect(entries).toHaveLength(2);
    expect(entries[0].description).toMatch(/Cafetaria/);
    expect(entries[0].userChose).toBe("11");
  });

  it("returns 200 with logged=0 for an empty corrections array", async () => {
    const res = await POST(buildRequest({ corrections: [] }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { logged: number };
    expect(body.logged).toBe(0);
    expect(logMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the body has no corrections array", async () => {
    const res = await POST(buildRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when userChose is not a valid CategoryCode", async () => {
    const res = await POST(
      buildRequest({
        corrections: [
          {
            merchant: null,
            description: "x",
            aiSuggested: "12",
            userChose: "99",
          },
        ],
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when a correction is missing description", async () => {
    const res = await POST(
      buildRequest({
        corrections: [{ merchant: null, userChose: "11" }],
      }),
    );
    expect(res.status).toBe(400);
  });
});
