import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { isBniLang, type BniLangCode } from "@/lib/nav-php-parity";
import { translate } from "./translate";

export function getLangFromCookies(jar: Pick<ReadonlyRequestCookies, "get">): BniLangCode {
  const raw = jar.get("bni_lang")?.value ?? "mn";
  return isBniLang(raw) ? raw : "mn";
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
