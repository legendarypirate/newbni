import { apiBase } from "@/lib/client-api-base";

export function normalizeApiBase(raw: string | undefined): string {
  const base = (raw || "").replace(/\/$/, "");
  if (!base) return "";
  return base.endsWith("/api") ? base : `${base}/api`;
}

/**
 * Server-side API root (SSR / Route Handlers → backend).
 *
 * `hostHint` is accepted for backwards compatibility but no longer used —
 * the runtime resolver in {@link apiBase} handles host-based fallbacks.
 */
export function resolveServerApiBase(_hostHint?: string | null): string {
  return apiBase();
}
