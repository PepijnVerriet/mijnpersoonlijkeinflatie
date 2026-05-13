/**
 * Vitest setup: load `.env.local` into `process.env` so tests can read
 * secrets like `ANTHROPIC_API_KEY` and feature flags like
 * `ENABLE_LIVE_AI_TESTS` without depending on the dotenv package.
 *
 * Existing env vars are not overwritten — the shell wins.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ENV_PATH = resolve(__dirname, "..", ".env.local");

if (existsSync(ENV_PATH)) {
  const content = readFileSync(ENV_PATH, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined && value.length > 0) {
      process.env[key] = value;
    }
  }
}
