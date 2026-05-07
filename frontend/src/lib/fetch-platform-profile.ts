import { serverAuthedFetch } from "@/lib/server-authed-fetch";

/** Loads `PlatformProfile` row via `GET /api/profiles/:accountId` (session cookies / bearer). */
export async function fetchPlatformProfileByAccountId(accountId: string): Promise<Record<string, unknown> | null> {
  const res = await serverAuthedFetch(`/profiles/${encodeURIComponent(accountId)}`);
  if (!res.ok) return null;
  const json = (await res.json().catch(() => null)) as { ok?: boolean; data?: Record<string, unknown> };
  if (!json?.ok || !json.data) return null;
  return json.data;
}
