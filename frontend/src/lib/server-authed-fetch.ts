import { headers } from "next/headers";
import { readBniTokenFromCookieHeader } from "./auth-cookie-token";
import { buildBackendUrl, resolveServerApiBase } from "./resolve-api-base";

type ServerAuthedFetchOpts = {
  bearerToken?: string | null;
};

/** Authenticated fetch from Server Components / Server Actions using incoming cookies. */
export async function serverAuthedFetch(
  pathWithLeadingSlash: string,
  init?: RequestInit,
  opts?: ServerAuthedFetchOpts,
): Promise<Response> {
  const h = await headers();
  const cookieHeader = h.get("cookie");
  const hdrs = new Headers(init?.headers);
  if (cookieHeader) hdrs.set("cookie", cookieHeader);
  const token = opts?.bearerToken ?? readBniTokenFromCookieHeader(cookieHeader);
  if (token) hdrs.set("Authorization", `Bearer ${token}`);
  const body = init?.body;
  if (body && !(body instanceof FormData) && !hdrs.has("Content-Type")) {
    hdrs.set("Content-Type", "application/json");
  }
  const hostHint = h.get("x-forwarded-host") || h.get("host");
  const base = resolveServerApiBase(hostHint);
  const url = buildBackendUrl(base, pathWithLeadingSlash);
  return fetch(url, { ...init, headers: hdrs, cache: "no-store" });
}
