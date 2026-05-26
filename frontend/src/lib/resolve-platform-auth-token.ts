import "server-only";

import { headers } from "next/headers";
import { readBniTokenFromCookieHeader } from "@/lib/auth-cookie-token";
import { readPlatformAuthTokenFromFormData } from "@/lib/platform-auth-token-field";

/** Cookie first, then optional bearer from a Server Action form post. */
export async function resolvePlatformAuthToken(formData?: FormData | null): Promise<string | null> {
  const h = await headers();
  const fromCookie = readBniTokenFromCookieHeader(h.get("cookie"));
  if (fromCookie) return fromCookie;
  return readPlatformAuthTokenFromFormData(formData ?? null);
}
