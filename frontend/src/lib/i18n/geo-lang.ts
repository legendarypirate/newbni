import type { BniLangCode } from "@/lib/nav-php-parity";

/** Cookie name shared with `/api/set-lang` and middleware. */
export const BNI_LANG_COOKIE = "bni_lang";
export const BNI_LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const COUNTRY_HEADER_NAMES = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "x-country-code",
  "x-geo-country",
  "cloudfront-viewer-country",
] as const;

/** Read ISO 3166-1 alpha-2 country from common CDN / proxy headers. */
export function countryCodeFromHeaders(headers: Headers): string | null {
  for (const name of COUNTRY_HEADER_NAMES) {
    const raw = headers.get(name)?.trim().toUpperCase();
    if (raw && /^[A-Z]{2}$/.test(raw) && raw !== "XX" && raw !== "T1") {
      return raw;
    }
  }
  return null;
}

/**
 * Default site language from visitor country (when no explicit `bni_lang` cookie).
 * KR → kr, CN → cn, Mongolia and all other countries → mn.
 */
export function langFromCountryCode(country: string | null | undefined): BniLangCode {
  const code = (country ?? "").trim().toUpperCase();
  if (code === "KR") return "kr";
  if (code === "CN") return "cn";
  return "mn";
}

export function langFromGeoHeaders(headers: Headers): BniLangCode {
  return langFromCountryCode(countryCodeFromHeaders(headers));
}
