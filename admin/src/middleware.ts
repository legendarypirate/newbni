import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiBase } from "@/lib/client-api-base";

/** Forward pathname for admin auth helpers (same behavior as busybni marketing app). */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  // Debug header: which backend API base SSR will use.
  res.headers.set("x-admin-api-base", apiBase());
  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
