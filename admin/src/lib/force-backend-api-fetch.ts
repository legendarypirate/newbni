const marker = "__busy_force_backend_api_fetch__";

function normalizeApiBase(raw: string | undefined): string {
  const base = (raw || "http://localhost:3001/api").replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

export function patchFetchToBackendApi(): void {
  const g = globalThis as typeof globalThis & { [marker]?: boolean };
  if (g[marker]) return;

  const apiBase = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
  const origFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (typeof input === "string") {
        if (input.startsWith("/api/")) {
          return origFetch(`${apiBase}${input.slice(4)}`, init);
        }
      } else if (input instanceof Request) {
        const u = input.url;
        if (u.startsWith("/api/")) {
          return origFetch(new Request(`${apiBase}${u.slice(4)}`, input), init);
        }
      } else if (input instanceof URL) {
        const s = input.toString();
        if (s.startsWith("/api/")) {
          return origFetch(`${apiBase}${s.slice(4)}`, init);
        }
      }
    } catch {
      /* fall through */
    }
    return origFetch(input as RequestInfo, init);
  }) as typeof fetch;

  g[marker] = true;
}

