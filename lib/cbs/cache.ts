/**
 * On-disk cache voor CBS API responses, per maand. Patroon analoog aan
 * `lib/categorizer/ai/cache.ts`: een interface met in-memory en JSON-file
 * implementaties, beide TTL-bewust (default 24h per principe 31).
 *
 * Het bestand wordt gitignored — het is een per-deploy artefact dat de CBS
 * latency dempt; geen source-of-truth.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import type { CategoryRates } from "./types";

export const PRODUCTION_CBS_CACHE_PATH = resolve(
  process.cwd(),
  "lib/cbs/data/api-cache.json",
);

export const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  /** ISO timestamp; we compare against `Date.now()` for TTL freshness. */
  fetchedAt: string;
  rates: CategoryRates;
}

interface CacheFileShape {
  _comment?: string;
  entries: Record<string, CacheEntry>;
}

export interface CbsCache {
  /** Returns a defensive copy of the rates if cached and fresh; `null` otherwise. */
  getFresh(month: string): CategoryRates | null;
  /** Stores rates for the given month, stamped with the current time. */
  put(month: string, rates: CategoryRates): void;
}

export class InMemoryCbsCache implements CbsCache {
  private readonly entries = new Map<string, CacheEntry>();

  constructor(private readonly ttlMs: number = DEFAULT_TTL_MS) {}

  getFresh(month: string): CategoryRates | null {
    const entry = this.entries.get(month);
    if (!entry) return null;
    if (Date.now() - new Date(entry.fetchedAt).getTime() > this.ttlMs) {
      return null;
    }
    return { ...entry.rates };
  }

  put(month: string, rates: CategoryRates): void {
    this.entries.set(month, {
      fetchedAt: new Date().toISOString(),
      rates: { ...rates },
    });
  }
}

const DEFAULT_COMMENT =
  "CBS API response cache. Sleutels zijn YYYY-MM. TTL 24h. " +
  "Niet in git (zie .gitignore) — per-deploy artefact, geen source-of-truth.";

export class JsonFileCbsCache implements CbsCache {
  private data: CacheFileShape;
  private writesDisabled = false;

  constructor(
    private readonly path: string,
    private readonly ttlMs: number = DEFAULT_TTL_MS,
  ) {
    this.data = JsonFileCbsCache.read(path);
  }

  private static read(path: string): CacheFileShape {
    if (!existsSync(path)) {
      return { _comment: DEFAULT_COMMENT, entries: {} };
    }
    try {
      const raw = readFileSync(path, "utf8");
      const parsed = JSON.parse(raw) as Partial<CacheFileShape>;
      return {
        _comment: parsed._comment ?? DEFAULT_COMMENT,
        entries: parsed.entries ?? {},
      };
    } catch {
      // eslint-disable-next-line no-console
      console.warn(
        `[CbsCache] corrupt cache file at ${path}, starting with empty cache`,
      );
      return { _comment: DEFAULT_COMMENT, entries: {} };
    }
  }

  getFresh(month: string): CategoryRates | null {
    const entry = this.data.entries[month];
    if (!entry) return null;
    if (Date.now() - new Date(entry.fetchedAt).getTime() > this.ttlMs) {
      return null;
    }
    return { ...entry.rates };
  }

  put(month: string, rates: CategoryRates): void {
    this.data.entries[month] = {
      fetchedAt: new Date().toISOString(),
      rates: { ...rates },
    };
    if (this.writesDisabled) return;
    try {
      mkdirSync(dirname(this.path), { recursive: true });
      writeFileSync(
        this.path,
        JSON.stringify(this.data, null, 2) + "\n",
        "utf8",
      );
    } catch (err) {
      this.writesDisabled = true;
      // eslint-disable-next-line no-console
      console.warn(
        "[cbs-cache] disk write failed, continuing in-memory only:",
        err instanceof Error ? err.message : err,
      );
    }
  }
}
