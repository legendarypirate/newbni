import { cookies, headers } from "next/headers";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { BniLangCode } from "@/lib/nav-php-parity";
import { translate } from "./translate";
import { resolveBniLang } from "./resolve-lang";

/** Prefer {@link getServerLang} so geo defaults apply on the first visit. */
export function getLangFromCookies(
  jar: Pick<ReadonlyRequestCookies, "get">,
  requestHeaders?: Headers,
): BniLangCode {
  return resolveBniLang(jar, requestHeaders);
}

/** Cookie + request geo headers (set by middleware on first visit). */
export async function getServerLang(): Promise<BniLangCode> {
  const jar = await cookies();
  const h = await headers();
  return resolveBniLang(jar, h);
}

export function htmlLangAttr(lang: BniLangCode): string {
  if (lang === "cn") return "zh";
  if (lang === "kr") return "ko";
  if (lang === "jp") return "ja";
  return lang;
}

export function withLangQuery(url: string, lang: BniLangCode): string {
  if (lang === "mn") return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}lang=${encodeURIComponent(lang)}`;
}

export function apiLangHeaders(lang: BniLangCode): HeadersInit {
  return lang === "mn" ? {} : { "X-BNI-Lang": lang };
}

export function createServerT(lang: BniLangCode) {
  return (key: string) => translate(lang, key);
}
