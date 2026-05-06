/** Shared API root for server-side calls (admin → backend). */

export function normalizeApiBase(raw: string | undefined): string {
  const base = (raw || "").replace(/\/$/, "");
  if (!base) return "";
  return base.endsWith("/api") ? base : `${base}/api`;
}

function mapApiBaseFromHost(hostRaw: string | null | undefined): string {
  const host = String(hostRaw || "").toLowerCase().trim();
  if (!host) return "";
  if (host.includes("testadmin.busy.mn")) return "https://testapi.busy.mn/api";
  if (host.includes("admin.busy.mn")) return "https://api.busy.mn/api";
  return "";
}

export function resolveServerApiBase(hostHint?: string | null): string {
  const internal = normalizeApiBase(process.env.API_INTERNAL_URL);
  if (internal) return internal;
  const publicApi = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
  if (publicApi) return publicApi;
  const mapped = mapApiBaseFromHost(hostHint);
  if (mapped) return mapped;
  return "http://localhost:3001/api";
}
