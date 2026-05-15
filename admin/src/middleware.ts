import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiBaseForServer } from "@/lib/client-api-base";

/** Forward pathname for admin auth helpers (same behavior as busybni marketing app). */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  // Debug header: which backend API base SSR will use.
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  res.headers.set("x-admin-api-base", apiBaseForServer(host));
  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
