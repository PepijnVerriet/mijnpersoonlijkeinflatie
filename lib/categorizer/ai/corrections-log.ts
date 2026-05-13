/**
 * Append-only JSONL log of user-supplied category corrections (CLAUDE.md
 * principle 21). One entry per LINE so the file can grow without rewriting
 * existing contents.
 *
 * The log is intentionally kept separate from the global AI cache: it
 * contains user-specific context (raw descriptions) and is meant for
 * periodic, *manual* review — used to spot patterns we can later codify
 * as new keywords in `lib/categorizer/keywords.ts`.
 *
 * Production storage note: on Vercel the filesystem is ephemeral, so every
 * deploy wipes the file. For production-grade persistence migrate to a
 * persistent store such as Vercel KV, Postgres, or an external logger
 * (e.g. Logtail). For v1 local-only development this file is plenty.
 *
 * Privacy: the log MUST never leave the deployment and MUST stay out of
 * git. See `.gitignore`.
 */
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { CategoryCode } from "@/lib/cbs/types";

export const PRODUCTION_CORRECTIONS_LOG_PATH = resolve(
  process.cwd(),
  "lib/categorizer/data/user-corrections.log",
);

export type CorrectionSource = "dev" | "prod";

export interface UserCorrectionEntry {
  /** ISO-8601 timestamp set automatically by `logUserCorrection`. */
  timestamp?: string;
  /** Whether this correction originated from a dev or production deploy. */
  source?: CorrectionSource;
  merchant: string | null;
  description: string;
  /** What the AI suggested (or null if AI was unavailable). */
  aiSuggested: CategoryCode | null;
  /** What the user ultimately chose. */
  userChose: CategoryCode;
}

function detectSource(): CorrectionSource {
  return process.env.NODE_ENV === "production" ? "prod" : "dev";
}

/**
 * Append one entry to the log. Errors (file-system permissions, no disk
 * space, EROFS on Vercel) are logged to the console but never bubble up:
 * a failed write must never block the user's correction flow.
 */
export async function logUserCorrection(
  entry: UserCorrectionEntry,
  options: { path?: string } = {},
): Promise<void> {
  const fullEntry: Required<Pick<UserCorrectionEntry, "timestamp" | "source">> &
    UserCorrectionEntry = {
    timestamp: entry.timestamp ?? new Date().toISOString(),
    source: entry.source ?? detectSource(),
    merchant: entry.merchant,
    description: entry.description,
    aiSuggested: entry.aiSuggested,
    userChose: entry.userChose,
  };

  const path = options.path ?? PRODUCTION_CORRECTIONS_LOG_PATH;
  const line = JSON.stringify(fullEntry) + "\n";

  try {
    await mkdir(dirname(path), { recursive: true });
    await appendFile(path, line, "utf8");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[corrections-log] failed to append, dropping entry", err);
  }
}

export async function logUserCorrections(
  entries: readonly UserCorrectionEntry[],
  options: { path?: string } = {},
): Promise<number> {
  let written = 0;
  for (const entry of entries) {
    await logUserCorrection(entry, options);
    written += 1;
  }
  return written;
}
