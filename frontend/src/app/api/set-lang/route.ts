import { NextResponse, type NextRequest } from "next/server";
import { isBniLang } from "@/lib/nav-php-parity";

/**
 * Mirrors the legacy PHP `scripts/change-lang.php` endpoint used by the navbar
 * language switcher. Validates the requested code, persists it as a `bni_lang`
 * cookie, and redirects to `next` (relative path only, defaulting to `/`).
 */
export const dynamic = "force-dynamic";

const COOKIE_NAME = "bni_lang";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function safeNext(raw: string | null): string {
  if (!raw) return "/";
  // Only allow same-origin paths so this can never be turned into an open redirect.
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const langParam = (url.searchParams.get("lang") || "").toLowerCase();
  const lang = isBniLang(langParam) ? langParam : "mn";
  const next = safeNext(url.searchParams.get("next"));

  const target = new URL(next, url.origin);
  const res = NextResponse.redirect(target, { status: 303 });
  res.cookies.set(COOKIE_NAME, lang, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
  });
  return res;
}
