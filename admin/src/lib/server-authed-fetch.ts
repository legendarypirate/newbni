import { headers } from "next/headers";
import { readBniTokenFromCookieHeader } from "./auth-cookie-token";
import { resolveServerApiBase } from "./resolve-api-base";

/**
 * Authenticated fetch from Server Components / Server Actions using the incoming request cookies.
 */
export async function serverAuthedFetch(pathWithLeadingSlash: string, init?: RequestInit): Promise<Response> {
  const h = await headers();
  const cookieHeader = h.get("cookie");
  const hdrs = new Headers(init?.headers);
  if (cookieHeader) hdrs.set("cookie", cookieHeader);
  const token = readBniTokenFromCookieHeader(cookieHeader);
  if (token) hdrs.set("Authorization", `Bearer ${token}`);
  const hostHint = h.get("x-forwarded-host") || h.get("host");
  const base = resolveServerApiBase(hostHint);
  const p = pathWithLeadingSlash.startsWith("/") ? pathWithLeadingSlash : `/${pathWithLeadingSlash}`;
  return fetch(`${base}${p}`, { ...init, headers: hdrs, cache: "no-store" });
}
