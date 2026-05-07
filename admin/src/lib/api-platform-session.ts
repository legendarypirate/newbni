import type { NextRequest } from "next/server";
import { fetchBusyAuthzForAccount } from "@/lib/busy-rbac";
import { apiBase } from "@/lib/client-api-base";

export type ApiPlatformUser = {
  id: bigint;
  email: string;
  displayName: string;
  /** Legacy `PlatformRole` from `bni_platform_accounts.role`. */
  legacyRole: string;
  profile: { displayName?: string | null; photoUrl?: string | null } | null;
};

export type ApiPlatformUserWithBusyAuthz = ApiPlatformUser & {
  busyRoleSlugs: string[];
  busyPermissionKeys: string[];
};

function readTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const tokenCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("bni_token="));
  return tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1] || "") : null;
}

async function loadApiPlatformUser(req: NextRequest): Promise<ApiPlatformUser | null> {
  const cookieHeader = req.headers.get("cookie");
  const token = readTokenFromCookieHeader(cookieHeader);
  const headers = new Headers();
  if (cookieHeader) headers.set("cookie", cookieHeader);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    const res = await fetch(`${apiBase()}/auth/me`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: {
        id?: string | number;
        email?: string;
        displayName?: string;
        role?: string;
        photoUrl?: string | null;
      };
    };
    const u = data.user;
    if (!u?.id || !u?.email) return null;
    const id = BigInt(u.id);
    return {
      id,
      email: String(u.email),
      displayName: String(u.displayName ?? u.email),
      legacyRole: String(u.role ?? ""),
      profile: { displayName: u.displayName ?? null, photoUrl: u.photoUrl ?? null },
    };
  } catch {
    return null;
  }
}

/** Resolve logged-in platform user from platform session cookies (same as `getPlatformSession`). */
export async function getApiPlatformUser(req: NextRequest): Promise<ApiPlatformUser | null> {
  return loadApiPlatformUser(req);
}

export async function getApiPlatformUserWithBusyAuthz(req: NextRequest): Promise<ApiPlatformUserWithBusyAuthz | null> {
  const base = await getApiPlatformUser(req);
  if (!base) return null;
  const authz = await fetchBusyAuthzForAccount(base.id);
  return { ...base, busyRoleSlugs: authz.roleSlugs, busyPermissionKeys: authz.permissionKeys };
}
