import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function normalizeApiBase(raw: string | undefined): string {
  const base = (raw || "").replace(/\/$/, "");
  if (!base) return "";
  return base.endsWith("/api") ? base : `${base}/api`;
}

function mapApiBaseFromHost(hostRaw: string | null): string {
  const host = String(hostRaw || "").toLowerCase().trim();
  if (!host) return "";
  if (host.includes("testadmin.busy.mn")) return "https://testapi.busy.mn/api";
  if (host.includes("admin.busy.mn")) return "https://api.busy.mn/api";
  return "";
}

function resolveDebugApiBase(request: NextRequest): string {
  const internal = normalizeApiBase(process.env.API_INTERNAL_URL);
  if (internal) return internal;
  const publicApi = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
  if (publicApi) return publicApi;
  const mapped = mapApiBaseFromHost(request.headers.get("x-forwarded-host") || request.headers.get("host"));
  if (mapped) return mapped;
  return "http://localhost:3001/api";
}

/** Forward pathname for admin auth helpers (same behavior as busybni marketing app). */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  // Temporary debug header: confirms which backend API base SSR will use.
  res.headers.set("x-admin-api-base", resolveDebugApiBase(request));
  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
