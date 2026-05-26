/**
 * Resolve the backend API base URL on both server and browser.
 *
 * Why: `NEXT_PUBLIC_*` env vars are inlined into the client bundle at *build*
 * time. If the build happens with `NEXT_PUBLIC_API_URL=http://localhost:3001`
 * (e.g. local `.env`), every browser running that bundle in production would
 * try to call `http://localhost:3001` — which is wrong.
 *
 * This helper:
 *   1. Uses the explicit env value when it points to a non-localhost host.
 *   2. On the browser, ALWAYS prefers a host-based mapping for known
 *      busy.mn production domains (so a misbuilt bundle still works).
 *   3. Falls back to `http://localhost:3001` for local dev.
 *
 * All output ends with `/api` (suitable for `${base}/platform/...`).
 */

declare global {
  interface Window {
    __BUSY_PUBLIC_CONFIG__?: { publicApiUrl?: string };
  }
}

function trimSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

/** Read API URL from runtime-injected config (set by `RuntimePublicConfig`). */
function readRuntimeApiUrl(): string {
  if (typeof window === "undefined") return "";
  return String(window.__BUSY_PUBLIC_CONFIG__?.publicApiUrl || "").trim();
}

function withApiSuffix(base: string): string {
  const b = trimSlash(base);
  if (!b) return "";
  return /\/api$/.test(b) ? b : `${b}/api`;
}

function isLocalHostUrl(u: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(u);
}

/** First hostname from `Host` / `X-Forwarded-Host` (no port). */
export function normalizeRequestHost(hostRaw: string | null | undefined): string {
  const first = String(hostRaw || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (!first) return "";
  return first.split(":")[0];
}

/** Infer API base from marketing site URL when request host is missing (SSR behind proxy). */
function apiBaseFromAppUrl(): string {
  const app = String(process.env.NEXT_PUBLIC_APP_URL || "").trim().toLowerCase();
  if (!app) return "";
  if (app.includes("test.busy.mn")) return "https://testapi.busy.mn/api";
  if (app.includes("busy.mn")) return "https://api.busy.mn/api";
  return "";
}

/** Map a browser hostname to a hard-coded backend base. Returns "" when unknown. */
export function mapBrowserHostToApiBase(hostRaw: string | null | undefined): string {
  const host = normalizeRequestHost(hostRaw);
  if (!host) return "";
  // Frontend public hosts
  if (host === "test.busy.mn") return "https://testapi.busy.mn/api";
  if (host === "busy.mn" || host === "www.busy.mn") return "https://api.busy.mn/api";
  // Admin hosts (in case the same helper is used there)
  if (host === "testadmin.busy.mn") return "https://testapi.busy.mn/api";
  if (host === "admin.busy.mn") return "https://api.busy.mn/api";
  return "";
}

/**
 * Server-side API base (SSR, Server Actions, Route Handlers).
 * Uses request host mapping first so `testadmin.busy.mn` → `testapi.busy.mn/api`.
 */
export function apiBaseForServer(hostHint?: string | null): string {
  const mapped = mapBrowserHostToApiBase(hostHint);
  if (mapped) return mapped;

  const fromApp = apiBaseFromAppUrl();
  if (fromApp) return fromApp;

  const explicit = withApiSuffix(process.env.BACKEND_API_URL || process.env.API_BASE_URL || "");
  if (explicit && !isLocalHostUrl(explicit)) return explicit;

  const internal = withApiSuffix(process.env.API_INTERNAL_URL || "");
  const pub = withApiSuffix(process.env.NEXT_PUBLIC_API_URL || "");

  if (internal && !isLocalHostUrl(internal)) return internal;
  if (pub && !isLocalHostUrl(pub)) return pub;
  if (internal) return internal;
  if (pub) return pub;

  if (process.env.NODE_ENV === "production") {
    return "https://api.busy.mn/api";
  }
  return "http://127.0.0.1:3001/api";
}

/**
 * Public backend base for server-rendered browser URLs (`form action`, etc.).
 */
export function publicApiBaseForServer(hostHint?: string | null): string {
  const mapped = mapBrowserHostToApiBase(hostHint);
  if (mapped) return mapped;

  const pub = withApiSuffix(process.env.NEXT_PUBLIC_API_URL || "");
  if (pub && !isLocalHostUrl(pub)) return pub;

  return apiBaseForServer(hostHint);
}

/**
 * Backend API base ending in `/api`, suitable for both server and client.
 *
 * Use this for fetches initiated from server code or client code where the
 * resulting URL will be **fetched by the same runtime** that called this
 * function. On the server it MAY return `API_INTERNAL_URL` (private host).
 *
 * If you need a URL that will be embedded in HTML for the browser to hit
 * (e.g. `<img src>`, `<a href>`, `<form action>`), use {@link publicApiBase}.
 *
 * - Server: host map → `API_INTERNAL_URL` → `NEXT_PUBLIC_API_URL` → localhost.
 * - Client: known host map → `NEXT_PUBLIC_API_URL` (if not localhost) →
 *           `http://localhost:3001/api`.
 */
export function apiBase(): string {
  if (typeof window === "undefined") {
    return apiBaseForServer(undefined);
  }

  // 1. Runtime-injected value (most authoritative — survives stale bundles).
  const runtime = withApiSuffix(readRuntimeApiUrl());
  if (runtime && !isLocalHostUrl(runtime)) return runtime;

  // 2. Hard-coded host map for known busy.mn deployments.
  const host = window.location.hostname;
  const mapped = mapBrowserHostToApiBase(host);
  if (mapped) return mapped;

  // 3. Build-time baked env (only honoured if it makes sense for this host).
  const baked = withApiSuffix(process.env.NEXT_PUBLIC_API_URL || "");
  if (baked && !(isLocalHostUrl(baked) && host !== "localhost" && host !== "127.0.0.1")) {
    return baked;
  }

  // 4. Runtime localhost (dev fallback).
  if (runtime) return runtime;
  return "http://localhost:3001/api";
}

/**
 * Browser-facing API base ending in `/api`. ALWAYS returns the public URL
 * (never `API_INTERNAL_URL`). Use this when generating `href` / `src` /
 * `formAction` values that the user's browser will hit directly.
 */
export function publicApiBase(): string {
  if (typeof window === "undefined") {
    return publicApiBaseForServer(undefined);
  }

  // 1. Runtime-injected value wins (matches whatever the running server has).
  const runtime = withApiSuffix(readRuntimeApiUrl());
  if (runtime && !isLocalHostUrl(runtime)) return runtime;

  // 2. Known busy.mn host map.
  const host = window.location.hostname;
  const mapped = mapBrowserHostToApiBase(host);
  if (mapped) return mapped;

  // 3. Build-time baked env.
  const baked = withApiSuffix(process.env.NEXT_PUBLIC_API_URL || "");
  if (baked && !(isLocalHostUrl(baked) && host !== "localhost" && host !== "127.0.0.1")) {
    return baked;
  }

  // 4. Runtime localhost (dev) → final fallback.
  if (runtime) return runtime;
  return "http://localhost:3001/api";
}

/** Server/client-side backend root (without `/api`). May be internal on the server. */
export function apiOrigin(): string {
  return apiBase().replace(/\/api$/, "");
}

/** Browser-facing backend root (without `/api`). */
export function publicApiOrigin(): string {
  return publicApiBase().replace(/\/api$/, "");
}

/** Build a full URL under `${apiBase}${path}`; `path` may start with `/`. */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase()}${p}`;
}

/** Build a browser-facing URL under `${publicApiBase}${path}`. */
export function publicApiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${publicApiBase()}${p}`;
}
