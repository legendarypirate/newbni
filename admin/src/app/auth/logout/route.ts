import { NextRequest, NextResponse } from "next/server";
import { attachClearPlatformSessionToResponse } from "@/lib/platform-session-cookies";

/** GET /auth/logout — clears admin platform session cookies. */
export async function GET(request: NextRequest) {
  const base = request.nextUrl.origin;
  const login = new URL("/admin/login", base);
  const res = NextResponse.redirect(login);
  attachClearPlatformSessionToResponse(res);
  res.cookies.set("bni_token", "", { path: "/", maxAge: 0, sameSite: "lax" });
  return res;
}
