import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  logUserCorrection,
  logUserCorrections,
} from "@/lib/categorizer/ai/corrections-log";

describe("logUserCorrection", () => {
  let dir: string;
  let path: string;
  let originalEnabled: string | undefined;

  beforeEach(() => {
    // Privacy-default is "off"; tests need to opt in explicitly.
    originalEnabled = process.env.CORRECTIONS_LOG_ENABLED;
    process.env.CORRECTIONS_LOG_ENABLED = "true";
    dir = mkdtempSync(join(tmpdir(), "corrections-"));
    path = join(dir, "user-corrections.log");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    if (originalEnabled === undefined) {
      delete process.env.CORRECTIONS_LOG_ENABLED;
    } else {
      process.env.CORRECTIONS_LOG_ENABLED = originalEnabled;
    }
  });

  it("creates the log file on first write and appends one JSONL line", async () => {
    await logUserCorrection(
      {
        merchant: "bouman",
        description: "Bouman: Cafetaria Marktzicht",
        aiSuggested: "12",
        userChose: "11",
      },
      { path },
    );

    expect(existsSync(path)).toBe(true);
    const contents = readFileSync(path, "utf8");
    expect(contents.endsWith("\n")).toBe(true);

    const lines = contents.trim().split("\n");
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.merchant).toBe("bouman");
    expect(parsed.aiSuggested).toBe("12");
    expect(parsed.userChose).toBe("11");
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("tags each entry with source 'dev' when NODE_ENV is not 'production'", async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    try {
      await logUserCorrection(
        {
          merchant: "x",
          description: "y",
          aiSuggested: null,
          userChose: "01",
        },
        { path },
      );
      const parsed = JSON.parse(readFileSync(path, "utf8").trim());
      expect(parsed.source).toBe("dev");
    } finally {
      process.env.NODE_ENV = original;
    }
  });

  it("tags entries with source 'prod' when NODE_ENV=production", async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      await logUserCorrection(
        { merchant: "x", description: "y", aiSuggested: null, userChose: "01" },
        { path },
      );
      const parsed = JSON.parse(readFileSync(path, "utf8").trim());
      expect(parsed.source).toBe("prod");
    } finally {
      process.env.NODE_ENV = original;
    }
  });

  it("appends subsequent entries on new lines", async () => {
    await logUserCorrection(
      { merchant: "a", description: "1", aiSuggested: "12", userChose: "01" },
      { path },
    );
    await logUserCorrection(
      { merchant: "b", description: "2", aiSuggested: "12", userChose: "07" },
      { path },
    );
    const lines = readFileSync(path, "utf8").trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).merchant).toBe("a");
    expect(JSON.parse(lines[1]).merchant).toBe("b");
  });

  it("does not throw on a file-system error (path = a directory)", async () => {
    // Pointing the path at the directory itself makes appendFile fail.
    await expect(
      logUserCorrection(
        { merchant: "x", description: "y", aiSuggested: null, userChose: "01" },
        { path: dir },
      ),
    ).resolves.toBeUndefined();
  });

  it("skips writing entirely when CORRECTIONS_LOG_ENABLED is unset", async () => {
    delete process.env.CORRECTIONS_LOG_ENABLED;
    await logUserCorrection(
      { merchant: "x", description: "y", aiSuggested: null, userChose: "01" },
      { path },
    );
    // No file was created: the call should have been a no-op.
    expect(existsSync(path)).toBe(false);
  });
});

describe("logUserCorrections (batch)", () => {
  let dir: string;
  let path: string;
  let originalEnabled: string | undefined;

  beforeEach(() => {
    originalEnabled = process.env.CORRECTIONS_LOG_ENABLED;
    process.env.CORRECTIONS_LOG_ENABLED = "true";
    dir = mkdtempSync(join(tmpdir(), "corrections-"));
    path = join(dir, "log.log");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    if (originalEnabled === undefined) {
      delete process.env.CORRECTIONS_LOG_ENABLED;
    } else {
      process.env.CORRECTIONS_LOG_ENABLED = originalEnabled;
    }
  });

  it("returns the number of entries it tried to write", async () => {
    const n = await logUserCorrections(
      [
        { merchant: "a", description: "1", aiSuggested: "12", userChose: "01" },
        { merchant: "b", description: "2", aiSuggested: "12", userChose: "07" },
        { merchant: "c", description: "3", aiSuggested: "12", userChose: "11" },
      ],
      { path },
    );
    expect(n).toBe(3);
    expect(readFileSync(path, "utf8").trim().split("\n")).toHaveLength(3);
  });
});
