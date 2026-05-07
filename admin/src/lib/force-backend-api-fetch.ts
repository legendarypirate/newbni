import { publicApiBase } from "@/lib/client-api-base";

const marker = "__busy_force_backend_api_fetch__";

/** See `frontend/src/lib/force-backend-api-fetch.ts` for full docs. */
export function patchFetchToBackendApi(): void {
  const g = globalThis as typeof globalThis & { [marker]?: boolean };
  if (g[marker]) return;

  const origFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const base = publicApiBase();
    try {
      if (typeof input === "string") {
        if (input.startsWith("/api/")) {
          return origFetch(`${base}${input.slice(4)}`, init);
        }
      } else if (input instanceof Request) {
        const u = input.url;
        if (u.startsWith("/api/")) {
          return origFetch(new Request(`${base}${u.slice(4)}`, input), init);
        }
      } else if (input instanceof URL) {
        const s = input.toString();
        if (s.startsWith("/api/")) {
          return origFetch(`${base}${s.slice(4)}`, init);
        }
      }
    } catch {
      /* fall through */
    }
    return origFetch(input as RequestInfo, init);
  }) as typeof fetch;

  g[marker] = true;
}
