/** Shared API root for server-side calls (admin → backend). */

export function normalizeApiBase(raw: string | undefined): string {
  const base = (raw || "").replace(/\/$/, "");
  if (!base) return "";
  return base.endsWith("/api") ? base : `${base}/api`;
}

export function resolveServerApiBase(): string {
  const internal = normalizeApiBase(process.env.API_INTERNAL_URL);
  if (internal) return internal;
  const publicApi = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
  if (publicApi) return publicApi;
  return "http://localhost:3001/api";
}
