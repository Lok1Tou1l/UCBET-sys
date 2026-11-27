import { ApiError } from "@/lib/api/client";

export function errorMessage(e: unknown, t: (k: string) => string): string {
  if (e instanceof ApiError) {
    if (e.status === 0) return t("state.network");
    if (e.status === 403) return t("state.forbiddenAction");
    if (e.status === 404) return t("state.itemNotFound");
    if (e.message && e.status < 500) return e.message;
  }
  return t("state.error");
}

/** Per-field errors returned by the backend (ApiError.details), or {} */
export function fieldErrors(e: unknown): Record<string, string> {
  return e instanceof ApiError && e.details ? e.details : {};
}
