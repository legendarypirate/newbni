import { NextRequest, NextResponse } from "next/server";
import { buildBackendUrl, resolveServerApiBase } from "@/lib/resolve-api-base";
import { setPlatformSessionCookies } from "@/lib/platform-session-cookies";

/** Set httpOnly session cookies after client login (Google OAuth / email). */
export async function POST(req: NextRequest) {
  let token = "";
  try {
    const body = (await req.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    return NextResponse.json({ ok: false, message: "invalid" }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ ok: false, message: "missing_token" }, { status: 400 });
  }

  const hostHint = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const base = resolveServerApiBase(hostHint);
  const url = buildBackendUrl(base, "/auth/me");

  const meRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!meRes.ok) {
    return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  }

  const data = (await meRes.json()) as { user?: { displayName?: string; email?: string } };
  const display = String(data.user?.displayName ?? data.user?.email ?? "").trim();
  if (!display) {
    return NextResponse.json({ ok: false, message: "invalid_user" }, { status: 401 });
  }

  await setPlatformSessionCookies(token, display);
  return NextResponse.json({ ok: true });
}
