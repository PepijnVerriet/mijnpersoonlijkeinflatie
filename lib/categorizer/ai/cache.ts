import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import type { Transaction } from "@/lib/parsers/types";
import type { AiCategoryResult } from "./types";

/**
 * Repository-relative path of the on-disk AI cache. Exported as a constant
 * so callers (the API route, scripts, tests) reference one source of truth
 * and the path is easy to override when moving to Vercel KV / a database.
 */
export const PRODUCTION_CACHE_PATH = resolve(
  process.cwd(),
  "lib/categorizer/data/ai-cache.json",
);

/**
 * Get/set of AI verdicts keyed on a *normalised merchant key* (no amounts,
 * dates or IBANs — see CLAUDE.md principle 12). `get` is sync because every
 * implementation must answer instantly. `set` is async to allow file flush.
 */
export interface AiCache {
  get(key: string): AiCategoryResult | null;
  set(key: string, value: AiCategoryResult): Promise<void>;
}

/**
 * Build a cache key from a transaction. Returns `null` to mean
 * "do not cache this one". We deliberately skip iDEAL (`id`) and
 * Rabo Betaalverzoek (`bv`) transactions: the counterparty there is a
 * friend's name (e.g. "Bouman") which would otherwise collapse different
 * descriptions to the same key.
 */
export function cacheKeyFor(t: Transaction): string | null {
  if (t.code === "id" || t.code === "bv") return null;
  const raw = `${t.merchant ?? ""} ${t.counterpartyName ?? ""}`.trim();
  if (raw.length === 0) return null;
  return raw.toLowerCase().replace(/\s+/g, " ");
}

/** Process-local cache. Default for tests and ad-hoc use. */
export class InMemoryCache implements AiCache {
  private readonly map = new Map<string, AiCategoryResult>();

  get(key: string): AiCategoryResult | null {
    return this.map.has(key) ? (this.map.get(key) as AiCategoryResult) : null;
  }

  async set(key: string, value: AiCategoryResult): Promise<void> {
    this.map.set(key, value);
  }
}

interface CacheFileShape {
  _comment?: string;
  entries: Record<string, AiCategoryResult>;
}

const DEFAULT_COMMENT =
  "Globale AI-categorisatie cache. Genormaliseerde merchant-keys. " +
  "Bevat GEEN persoonlijke data (geen IBANs, bedragen, data). " +
  "v1-keuze: in git ingecheckt. Voor productie met meerdere gebruikers " +
  "vervangen door een gedeelde datastore (database / KV-store).";

/**
 * File-backed cache. Reads the JSON once at construction; rewrites the full
 * file on each `set`. Single-user, low-volume — concurrency is not a goal.
 */
export class JsonFileCache implements AiCache {
  private data: CacheFileShape;
  private writesDisabled = false;

  constructor(private readonly path: string) {
    this.data = JsonFileCache.read(path);
  }

  private static read(path: string): CacheFileShape {
    if (!existsSync(path)) {
      return { _comment: DEFAULT_COMMENT, entries: {} };
    }
    const raw = readFileSync(path, "utf8");
    try {
      const parsed = JSON.parse(raw) as Partial<CacheFileShape>;
      return {
        _comment: parsed._comment ?? DEFAULT_COMMENT,
        entries: parsed.entries ?? {},
      };
    } catch {
      return { _comment: DEFAULT_COMMENT, entries: {} };
    }
  }

  get(key: string): AiCategoryResult | null {
    return Object.prototype.hasOwnProperty.call(this.data.entries, key)
      ? this.data.entries[key]
      : null;
  }

  async set(key: string, value: AiCategoryResult): Promise<void> {
    this.data.entries[key] = value;
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
        "[ai-cache] disk write failed, continuing in-memory only:",
        err instanceof Error ? err.message : err,
      );
    }
  }
}
