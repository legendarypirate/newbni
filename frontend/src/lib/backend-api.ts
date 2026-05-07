import { apiBase, apiOrigin, publicApiOrigin } from "@/lib/client-api-base";

/**
 * Backend API URL for fetches done from the runtime that calls this function.
 *
 * Use from Server Components / Route Handlers when YOU are the one fetching.
 * On the server, may resolve to `API_INTERNAL_URL` (private host).
 *
 *   internalApiUrl("/api/foo") → `<origin>/api/foo`
 */
export function internalApiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${apiOrigin()}${p}`;
}

/**
 * Browser-facing backend URL — always the public origin (never the internal
 * host). Use this when embedding URLs into HTML for the user's browser to
 * hit directly (`<img src>`, `<a href>`, `<form action>`, …).
 */
export function publicApiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${publicApiOrigin()}${p}`;
}

/** Backend API base ending in `/api`, e.g. `https://testapi.busy.mn/api`. */
export function backendApiBase(): string {
  return apiBase();
}
