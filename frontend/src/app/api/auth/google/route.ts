import { NextRequest, NextResponse } from "next/server";
import { publicApiOrigin } from "@/lib/client-api-base";

function safeNextPath(raw: string | null): string {
  if (!raw) return "/platform";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/platform";
  return t.slice(0, 512);
}

export async function GET(request: NextRequest) {
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));
  // This URL is followed by the browser, so it must use the same public host
  // as the backend OAuth callback. Using API_INTERNAL_URL (127.0.0.1 in dev)
  // sets the state cookie on a different host than BACKEND_URL (localhost).
  const target = new URL("/api/auth/google", publicApiOrigin());
  if (nextPath !== "/platform") {
    target.searchParams.set("next", nextPath);
  }
  const res = NextResponse.redirect(target);
  // Clear stale auth/session before OAuth start so old admin JWT is never reused on error/cancel paths.
  res.cookies.set("bni_token", "", { path: "/", maxAge: 0, sameSite: "lax" });
  res.cookies.set("bni_platform_account_id", "", { path: "/", maxAge: 0, sameSite: "lax", httpOnly: true });
  res.cookies.set("bni_platform_account_ref", "", { path: "/", maxAge: 0, sameSite: "lax" });
  res.cookies.set("bni_platform_nav_display", "", { path: "/", maxAge: 0, sameSite: "lax" });
  return res;
}
