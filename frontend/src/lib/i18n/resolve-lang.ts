import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { isBniLang, type BniLangCode } from "@/lib/nav-php-parity";
import { langFromGeoHeaders } from "./geo-lang";

const MIDDLEWARE_LANG_HEADER = "x-bni-lang";

/** Resolve language: explicit cookie → middleware geo header → geo headers → mn. */
export function resolveBniLang(
  jar: Pick<ReadonlyRequestCookies, "get">,
  requestHeaders?: Headers,
): BniLangCode {
  const cookieRaw = jar.get("bni_lang")?.value;
  if (cookieRaw && isBniLang(cookieRaw)) {
    return cookieRaw;
  }

  if (requestHeaders) {
    const fromMiddleware = requestHeaders.get(MIDDLEWARE_LANG_HEADER)?.trim().toLowerCase();
    if (fromMiddleware && isBniLang(fromMiddleware)) {
      return fromMiddleware;
    }
    return langFromGeoHeaders(requestHeaders);
  }

  return "mn";
}

export { MIDDLEWARE_LANG_HEADER };
