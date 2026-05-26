import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { readBniTokenFromCookieHeader } from "@/lib/auth-cookie-token";
import { buildBackendUrl, resolveServerApiBase } from "@/lib/resolve-api-base";

export type PlatformUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  photoUrl: string | null;
  companyName: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
};

type PlatformSessionOpts = {
  bearerToken?: string | null;
};

export async function getPlatformSession(opts?: PlatformSessionOpts): Promise<PlatformUser | null> {
  try {
    const h = await headers();
    const cookieHeader = h.get("cookie");
    const hostHint = h.get("x-forwarded-host") || h.get("host");
    const token = opts?.bearerToken ?? readBniTokenFromCookieHeader(cookieHeader);
    if (!token) return null;

    const hdrs = new Headers();
    if (cookieHeader) hdrs.set("cookie", cookieHeader);
    hdrs.set("Authorization", `Bearer ${token}`);

    const base = resolveServerApiBase(hostHint);
    const url = buildBackendUrl(base, "/auth/me");
    const res = await fetch(url, { headers: hdrs, cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: PlatformUser | null };
    return data.user || null;
  } catch {
    return null;
  }
}

export async function requirePlatformUser(nextPath = "/platform"): Promise<PlatformUser> {
  const u = await getPlatformSession();
  if (!u) {
    const q = nextPath.startsWith("/") ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/auth/login${q}`);
  }
  return u;
}

export function getPlatformLoginNextPath(h: Headers): string {
  const raw = h.get("x-pathname")?.trim() ?? "";
  if (raw.startsWith("/platform") && !raw.startsWith("//")) {
    return raw.slice(0, 512);
  }
  return "/platform";
}

export function defaultPostLoginPath(requested: string, role?: string): string {
  if (role === "admin") {
    return (process.env.NEXT_PUBLIC_ADMIN_URL?.trim().replace(/\/$/, "") || "http://localhost:3002") + "/admin";
  }

  const t = requested.trim();
  if (t === "" || t === "/") {
    return "/platform";
  }
  if (!t.startsWith("/") || t.startsWith("//")) return "/platform";
  return t.slice(0, 512);
}
