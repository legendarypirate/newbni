import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Forward pathname for admin auth helpers (same behavior as busybni marketing app). */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*"],
};
