import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  InMemoryCbsCache,
  JsonFileCbsCache,
} from "@/lib/cbs/cache";
import type { CategoryRates } from "@/lib/cbs/types";

const SAMPLE_RATES: CategoryRates = {
  "01": 2.0, "02": 2.1, "03": 1.3, "04": 3.5,
  "05": -0.6, "06": 0.7, "07": 5.2, "08": -1.2,
  "09": 1.8, "10": 3.3, "11": 4.8, "12": 5.0,
  "13": 3.7, "14": 0,
};

describe("InMemoryCbsCache", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns null for an unknown month", () => {
    const cache = new InMemoryCbsCache();
    expect(cache.getFresh("2026-03")).toBeNull();
  });

  it("returns the stored value when fresh", () => {
    const cache = new InMemoryCbsCache();
    cache.put("2026-03", SAMPLE_RATES, null);
    expect(cache.getFresh("2026-03")).toEqual(SAMPLE_RATES);
  });

  it("expires entries after the TTL", () => {
    const cache = new InMemoryCbsCache(1000);
    cache.put("2026-03", SAMPLE_RATES, null);
    vi.advanceTimersByTime(1001);
    expect(cache.getFresh("2026-03")).toBeNull();
  });

  it("returns a defensive copy (caller mutation does not poison cache)", () => {
    const cache = new InMemoryCbsCache();
    cache.put("2026-03", SAMPLE_RATES, null);
    const a = cache.getFresh("2026-03")!;
    a["01"] = 999;
    const b = cache.getFresh("2026-03")!;
    expect(b["01"]).toBe(SAMPLE_RATES["01"]);
  });

  it("stores and returns the headline alongside rates", () => {
    const cache = new InMemoryCbsCache();
    cache.put("2026-03", SAMPLE_RATES, 2.7);
    expect(cache.getFreshHeadline("2026-03")).toBe(2.7);
  });

  it("returns null headline for an unknown month or a null-headline entry", () => {
    const cache = new InMemoryCbsCache();
    expect(cache.getFreshHeadline("2026-03")).toBeNull();
    cache.put("2026-03", SAMPLE_RATES, null);
    expect(cache.getFreshHeadline("2026-03")).toBeNull();
  });

  it("expires headline together with rates after the TTL", () => {
    const cache = new InMemoryCbsCache(1000);
    cache.put("2026-03", SAMPLE_RATES, 2.7);
    expect(cache.getFreshHeadline("2026-03")).toBe(2.7);
    vi.advanceTimersByTime(1001);
    expect(cache.getFreshHeadline("2026-03")).toBeNull();
  });
});

describe("JsonFileCbsCache", () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    vi.useFakeTimers();
    dir = mkdtempSync(join(tmpdir(), "cbs-cache-"));
    path = join(dir, "api-cache.json");
  });

  afterEach(() => {
    vi.useRealTimers();
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns null when the cache file does not exist", () => {
    const cache = new JsonFileCbsCache(path);
    expect(cache.getFresh("2026-03")).toBeNull();
  });

  it("persists writes across separate instances", () => {
    const writer = new JsonFileCbsCache(path);
    writer.put("2026-03", SAMPLE_RATES, null);
    const reader = new JsonFileCbsCache(path);
    expect(reader.getFresh("2026-03")).toEqual(SAMPLE_RATES);
  });

  it("treats a corrupt file as empty and logs a warning", () => {
    writeFileSync(path, "{ not valid json", "utf8");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cache = new JsonFileCbsCache(path);
    expect(cache.getFresh("2026-03")).toBeNull();
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });

  it("respects TTL on read", () => {
    const cache = new JsonFileCbsCache(path, 1000);
    cache.put("2026-03", SAMPLE_RATES, null);
    expect(cache.getFresh("2026-03")).toEqual(SAMPLE_RATES);
    vi.advanceTimersByTime(1001);
    expect(cache.getFresh("2026-03")).toBeNull();
  });

  it("persists the headline across separate instances", () => {
    const writer = new JsonFileCbsCache(path);
    writer.put("2026-03", SAMPLE_RATES, 2.7);
    const reader = new JsonFileCbsCache(path);
    expect(reader.getFreshHeadline("2026-03")).toBe(2.7);
  });

  it("does not throw when disk writes fail (read-only FS, Vercel)", () => {
    // Force mkdirSync to fail by aiming at a path *inside a regular file*.
    // mkdirSync then throws ENOTDIR, simulating Vercel /var/task/ rejecting
    // writes with EROFS/ENOENT.
    const blocker = join(dir, "blocker");
    writeFileSync(blocker, "i am a file, not a directory", "utf8");
    const unwritablePath = join(blocker, "api-cache.json");

    const cache = new JsonFileCbsCache(unwritablePath);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => cache.put("2026-03", SAMPLE_RATES, null)).not.toThrow();
    // In-memory state must still reflect the put.
    expect(cache.getFresh("2026-03")).toEqual(SAMPLE_RATES);
    expect(warnSpy).toHaveBeenCalledOnce();

    // Second failed put must NOT warn again (writesDisabled latches).
    cache.put("2026-04", SAMPLE_RATES, null);
    expect(cache.getFresh("2026-04")).toEqual(SAMPLE_RATES);
    expect(warnSpy).toHaveBeenCalledOnce();

    warnSpy.mockRestore();
  });
});
