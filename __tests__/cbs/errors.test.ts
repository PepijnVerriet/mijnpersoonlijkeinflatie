import { describe, expect, it } from "vitest";
import { CbsApiError } from "@/lib/cbs/errors";

describe("CbsApiError", () => {
  it("is an instance of Error and itself", () => {
    const err = new CbsApiError("oops", "network");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(CbsApiError);
    expect(err.name).toBe("CbsApiError");
    expect(err.message).toBe("oops");
  });

  it("stores kind and status", () => {
    const httpErr = new CbsApiError("nope", "http", 500);
    expect(httpErr.kind).toBe("http");
    expect(httpErr.status).toBe(500);
  });

  it("leaves status undefined for non-HTTP errors", () => {
    const netErr = new CbsApiError("offline", "network");
    expect(netErr.status).toBeUndefined();
  });
});
