/** Why a CBS API call failed. Useful for logging; v1 treats them all alike. */
export type CbsApiErrorKind = "network" | "http" | "parse" | "timeout";

/**
 * Thrown by the live CBS API provider when the upstream call cannot produce
 * a usable rate map. Callers in v1 catch any `CbsApiError` and fall back to
 * the mock provider (see `getCbsProvider` in `lib/cbs/index.ts`).
 */
export class CbsApiError extends Error {
  readonly kind: CbsApiErrorKind;
  readonly status?: number;

  constructor(message: string, kind: CbsApiErrorKind, status?: number) {
    super(message);
    this.name = "CbsApiError";
    this.kind = kind;
    this.status = status;
  }
}
