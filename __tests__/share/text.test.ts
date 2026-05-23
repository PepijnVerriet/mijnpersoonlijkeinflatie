import { describe, expect, it } from "vitest";
import {
  buildLinkedInUrl,
  buildOgImageUrl,
  buildShareSentence,
  buildShareTargetUrl,
  buildWhatsAppUrl,
  buildXUrl,
  decodePeriodParam,
  encodePeriodParam,
  formatMonthNl,
  formatNumberNl,
  formatPeriodLabel,
  type ShareParams,
} from "@/lib/share/text";

const BASE = "https://mijnpersoonlijkeinflatie.nl";

function paramsFixture(overrides: Partial<ShareParams> = {}): ShareParams {
  return {
    personal: 3.42,
    reference: 2.7,
    monthsIncluded: ["2026-03"],
    usingMockData: false,
    ...overrides,
  };
}

describe("formatNumberNl", () => {
  it("formats with Dutch comma decimal and two fraction digits by default", () => {
    expect(formatNumberNl(3.42)).toBe("3,42");
    expect(formatNumberNl(3)).toBe("3,00");
    expect(formatNumberNl(-2.5)).toBe("-2,50");
  });

  it("honours a custom decimals count", () => {
    expect(formatNumberNl(3.42, 1)).toBe("3,4");
    expect(formatNumberNl(3.42, 0)).toBe("3");
  });
});

describe("formatMonthNl", () => {
  it("formats YYYY-MM into Dutch month name + year", () => {
    expect(formatMonthNl("2026-03")).toBe("maart 2026");
    expect(formatMonthNl("2025-01")).toBe("januari 2025");
    expect(formatMonthNl("2024-12")).toBe("december 2024");
  });

  it("falls back to the raw month code on unknown indices", () => {
    expect(formatMonthNl("2026-13")).toBe("13 2026");
  });
});

describe("formatPeriodLabel", () => {
  it("returns 'deze periode' for an empty list", () => {
    expect(formatPeriodLabel([])).toBe("deze periode");
  });

  it("returns the single month name for a one-month period", () => {
    expect(formatPeriodLabel(["2026-03"])).toBe("maart 2026");
  });

  it("joins first and last with 't/m' for multi-month periods", () => {
    expect(formatPeriodLabel(["2026-01", "2026-02", "2026-03"])).toBe(
      "januari 2026 t/m maart 2026",
    );
  });
});

describe("encodePeriodParam / decodePeriodParam round-trip", () => {
  it("encodes a single month as YYYY-MM", () => {
    expect(encodePeriodParam(["2026-03"])).toBe("2026-03");
  });

  it("encodes a range with .. separator", () => {
    expect(encodePeriodParam(["2026-01", "2026-02", "2026-03"])).toBe(
      "2026-01..2026-03",
    );
  });

  it("returns an empty string for empty input", () => {
    expect(encodePeriodParam([])).toBe("");
  });

  it("decodes a single-month token", () => {
    expect(decodePeriodParam("2026-03")).toEqual({
      from: "2026-03",
      to: "2026-03",
      isSingleMonth: true,
    });
  });

  it("decodes a range token", () => {
    expect(decodePeriodParam("2026-01..2026-03")).toEqual({
      from: "2026-01",
      to: "2026-03",
      isSingleMonth: false,
    });
  });

  it("treats a degenerate range (from===to) as a single month", () => {
    expect(decodePeriodParam("2026-03..2026-03")).toEqual({
      from: "2026-03",
      to: "2026-03",
      isSingleMonth: true,
    });
  });

  it("returns null for malformed input", () => {
    expect(decodePeriodParam("")).toBeNull();
    expect(decodePeriodParam("bogus")).toBeNull();
    expect(decodePeriodParam("2026-3")).toBeNull();
    expect(decodePeriodParam("2026-03..bogus")).toBeNull();
    expect(decodePeriodParam("'); DROP TABLE--")).toBeNull();
  });
});

describe("buildShareSentence", () => {
  it("builds a Dutch sentence with comma decimal and period label", () => {
    expect(buildShareSentence(paramsFixture())).toBe(
      "Mijn inflatie over maart 2026 was 3,42%. Bereken jouw inflatie:",
    );
  });

  it("handles multi-month periods", () => {
    const params = paramsFixture({
      monthsIncluded: ["2025-12", "2026-01", "2026-02", "2026-03"],
    });
    expect(buildShareSentence(params)).toBe(
      "Mijn inflatie over december 2025 t/m maart 2026 was 3,42%. Bereken jouw inflatie:",
    );
  });

  it("handles negative inflation", () => {
    const params = paramsFixture({ personal: -1.25 });
    expect(buildShareSentence(params)).toBe(
      "Mijn inflatie over maart 2026 was -1,25%. Bereken jouw inflatie:",
    );
  });
});

describe("buildShareTargetUrl", () => {
  it("builds an absolute /share URL with all params", () => {
    expect(buildShareTargetUrl(BASE, paramsFixture())).toBe(
      "https://mijnpersoonlijkeinflatie.nl/share?personal=3.42&reference=2.70&period=2026-03",
    );
  });

  it("omits the reference param when no reference is available", () => {
    const url = buildShareTargetUrl(BASE, paramsFixture({ reference: undefined }));
    expect(url).toBe(
      "https://mijnpersoonlijkeinflatie.nl/share?personal=3.42&period=2026-03",
    );
  });

  it("encodes a range period and adds mock=1 when using mock data", () => {
    const url = buildShareTargetUrl(
      BASE,
      paramsFixture({
        monthsIncluded: ["2026-01", "2026-02", "2026-03"],
        usingMockData: true,
      }),
    );
    expect(url).toBe(
      "https://mijnpersoonlijkeinflatie.nl/share?personal=3.42&reference=2.70&period=2026-01..2026-03&mock=1",
    );
  });

  it("omits the period param entirely for an empty months list", () => {
    const url = buildShareTargetUrl(BASE, paramsFixture({ monthsIncluded: [] }));
    expect(url).toBe(
      "https://mijnpersoonlijkeinflatie.nl/share?personal=3.42&reference=2.70",
    );
  });
});

describe("buildOgImageUrl", () => {
  it("builds an absolute /api/og URL using the same params layout", () => {
    expect(buildOgImageUrl(BASE, paramsFixture())).toBe(
      "https://mijnpersoonlijkeinflatie.nl/api/og?personal=3.42&reference=2.70&period=2026-03",
    );
  });
});

describe("buildLinkedInUrl", () => {
  it("wraps the target URL in LinkedIn's share-offsite endpoint", () => {
    const target = "https://mijnpersoonlijkeinflatie.nl/share?personal=3.42";
    expect(buildLinkedInUrl(target)).toBe(
      "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fmijnpersoonlijkeinflatie.nl%2Fshare%3Fpersonal%3D3.42",
    );
  });
});

describe("buildWhatsAppUrl", () => {
  it("combines sentence and URL in one text param, properly encoded", () => {
    const target = "https://mijnpersoonlijkeinflatie.nl/share?personal=3.42";
    const sentence = "Mijn inflatie was 3,42%.";
    const url = buildWhatsAppUrl(target, sentence);
    expect(url).toBe(
      "https://wa.me/?text=Mijn+inflatie+was+3%2C42%25.+https%3A%2F%2Fmijnpersoonlijkeinflatie.nl%2Fshare%3Fpersonal%3D3.42",
    );
  });

  it("percent-encodes the % sign so WhatsApp does not misinterpret it", () => {
    const url = buildWhatsAppUrl("https://x.test/", "10% korting");
    expect(url).toContain("10%25+korting");
  });
});

describe("buildXUrl", () => {
  it("uses separate text and url params on X's intent endpoint", () => {
    const target = "https://mijnpersoonlijkeinflatie.nl/share?personal=3.42";
    const sentence = "Mijn inflatie was 3,42%.";
    expect(buildXUrl(target, sentence)).toBe(
      "https://twitter.com/intent/tweet?text=Mijn+inflatie+was+3%2C42%25.&url=https%3A%2F%2Fmijnpersoonlijkeinflatie.nl%2Fshare%3Fpersonal%3D3.42",
    );
  });
});
