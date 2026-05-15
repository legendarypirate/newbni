import { publicApiBase } from "@/lib/client-api-base";
import { getAuthToken } from "@/lib/api-client";

const marker = "__busy_force_backend_api_fetch__";

function backendApiPath(input: string): string | null {
  if (!input.startsWith("/api/")) return null;
  return `${publicApiBase()}${input.slice(4)}`;
}

function withAuthInit(init?: RequestInit): RequestInit {
  const next: RequestInit = {
    ...init,
    credentials: init?.credentials ?? "include",
  };
  const token = getAuthToken();
  if (!token) return next;
  const headers = new Headers(init?.headers);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  next.headers = headers;
  return next;
}

function withAuthRequest(input: Request, url: string): Request {
  const headers = new Headers(input.headers);
  const token = getAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return new Request(url, {
    method: input.method,
    headers,
    body: input.body,
    mode: input.mode,
    credentials: input.credentials === "omit" ? "include" : input.credentials || "include",
    cache: input.cache,
    redirect: input.redirect,
    referrer: input.referrer,
    integrity: input.integrity,
    keepalive: input.keepalive,
    signal: input.signal,
  });
}

/**
 * Monkey-patch `globalThis.fetch` so any call to `/api/...` is rewritten
 * to the backend (`<publicApiBase>/...`) with Bearer auth when `bni_token` exists.
 */
export function patchFetchToBackendApi(): void {
  const g = globalThis as typeof globalThis & { [marker]?: boolean };
  if (g[marker]) return;

  const origFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const augmented = withAuthInit(init);
    try {
      if (typeof input === "string") {
        const url = backendApiPath(input);
        if (url) return origFetch(url, augmented);
      } else if (input instanceof Request) {
        let path = input.url;
        try {
          path = new URL(input.url, window.location.origin).pathname;
        } catch {
          /* keep raw */
        }
        const url = backendApiPath(path);
        if (url) return origFetch(withAuthRequest(input, url), augmented);
      } else if (input instanceof URL) {
        const url = backendApiPath(input.pathname);
        if (url) return origFetch(url, augmented);
      }
    } catch {
      /* fall through */
    }
    return origFetch(input as RequestInfo, augmented);
  }) as typeof fetch;

  g[marker] = true;
}
