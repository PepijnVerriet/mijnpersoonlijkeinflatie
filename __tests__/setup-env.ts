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

// CBS-tests draaien standaard tegen de deterministische mock-provider.
// .env.local zet CBS_PROVIDER=live voor productie; tests moeten dat
// negeren om geen live API-calls te doen tijdens npm test.
// Voor opt-in live testen: ENABLE_LIVE_CBS_TESTS=1 in shell-env.
if (!process.env.ENABLE_LIVE_CBS_TESTS) {
  delete process.env.CBS_PROVIDER;
}
