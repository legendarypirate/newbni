import { apiBaseForServer } from "@/lib/client-api-base";

export function normalizeApiBase(raw: string | undefined): string {
  const base = (raw || "").replace(/\/$/, "");
  if (!base) return "";
  return base.endsWith("/api") ? base : `${base}/api`;
}

/**
 * Join API base (ends with `/api`) and path. Strips a redundant `/api` prefix from
 * paths like `/api/home` so callers do not produce `/api/api/home`.
 */
export function buildBackendUrl(base: string, pathWithLeadingSlash: string): string {
  const baseNorm = (base || "").replace(/\/+$/, "");
  let path = pathWithLeadingSlash.startsWith("/") ? pathWithLeadingSlash : `/${pathWithLeadingSlash}`;
  if (/\/api$/i.test(baseNorm) && /^\/api(\/|$)/i.test(path)) {
    path = path.replace(/^\/api/, "") || "/";
  }
  return `${baseNorm}${path}`;
}

/**
 * Server-side API root (SSR / Route Handlers → backend).
 * Pass `x-forwarded-host` / `host` so admin (`testadmin.busy.mn`) hits `testapi.busy.mn`.
 */
export function resolveServerApiBase(hostHint?: string | null): string {
  return apiBaseForServer(hostHint);
}
