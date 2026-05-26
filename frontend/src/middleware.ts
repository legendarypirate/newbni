import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isBniLang } from "@/lib/nav-php-parity";
import {
  BNI_LANG_COOKIE,
  BNI_LANG_COOKIE_MAX_AGE,
  countryCodeFromHeaders,
  langFromCountryCode,
} from "@/lib/i18n/geo-lang";
import { MIDDLEWARE_LANG_HEADER } from "@/lib/i18n/resolve-lang";

function applyLangCookie(response: NextResponse, lang: string) {
  response.cookies.set(BNI_LANG_COOKIE, lang, {
    path: "/",
    maxAge: BNI_LANG_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
  });
}

/** Forward pathname; set default `bni_lang` from visitor country when cookie is missing. */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const existing = request.cookies.get(BNI_LANG_COOKIE)?.value?.toLowerCase();
  const hasValidCookie = Boolean(existing && isBniLang(existing));

  const lang = hasValidCookie
    ? existing!
    : langFromCountryCode(countryCodeFromHeaders(request.headers));

  requestHeaders.set(MIDDLEWARE_LANG_HEADER, lang);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (!hasValidCookie) {
    applyLangCookie(response, lang);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|api/set-lang).*)",
  ],
};
