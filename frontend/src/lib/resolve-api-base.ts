import { apiBaseForServer } from "@/lib/client-api-base";

export function normalizeApiBase(raw: string | undefined): string {
  const base = (raw || "").replace(/\/$/, "");
  if (!base) return "";
  return base.endsWith("/api") ? base : `${base}/api`;
}

/**
 * Server-side API root (SSR / Route Handlers → backend).
 * Pass `x-forwarded-host` / `host` so admin (`testadmin.busy.mn`) hits `testapi.busy.mn`.
 */
export function resolveServerApiBase(hostHint?: string | null): string {
  return apiBaseForServer(hostHint);
}
