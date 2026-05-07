import type { NextRequest } from "next/server";
import { PLATFORM_ACCOUNT_REF_COOKIE, readCookieValueFromHeader } from "@/lib/platform-session-cookies";
import { fetchBusyAuthzForAccount } from "@/lib/busy-rbac";
import type { PlatformProfile, PlatformRole } from "@/lib/platform-db-types";
import { resolveServerApiBase } from "@/lib/resolve-api-base";

export type ApiPlatformUser = {
  id: bigint;
  email: string;
  displayName: string;
  /** Legacy `PlatformRole` from `bni_platform_accounts.role`. */
  legacyRole: PlatformRole;
  profile: Pick<PlatformProfile, "displayName" | "photoUrl"> | null;
  /** Populated when resolved via JWT `/auth/me`. */
  busyRoleSlugs?: string[];
  busyPermissionKeys?: string[];
};

export type ApiPlatformUserWithBusyAuthz = ApiPlatformUser & {
  busyRoleSlugs: string[];
  busyPermissionKeys: string[];
};

function parseAccountId(raw: string | undefined): bigint | null {
  if (!raw) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

function readTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const tokenCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("bni_token="));
  return tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1] || "") : null;
}

async function loadApiPlatformUserFromJwt(req: NextRequest): Promise<ApiPlatformUser | null> {
  const cookieHeader = req.headers.get("cookie");
  const authHeader = req.headers.get("authorization");
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim() || null;
  }
  if (!token) token = readTokenFromCookieHeader(cookieHeader);
  if (!token) return null;

  const headersInit = new Headers();
  if (cookieHeader) headersInit.set("cookie", cookieHeader);
  headersInit.set("Authorization", `Bearer ${token}`);

  try {
    const res = await fetch(`${resolveServerApiBase()}/auth/me`, {
      headers: headersInit,
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
        busyRoleSlugs?: unknown;
        busyPermissionKeys?: unknown;
      };
    };
    const u = data.user;
    if (!u?.id || !u?.email) return null;
    const id = BigInt(String(u.id));
    const legacyRole = u.role as PlatformRole;
    const busyRoleSlugs = Array.isArray(u.busyRoleSlugs) ? u.busyRoleSlugs.map(String) : undefined;
    const busyPermissionKeys = Array.isArray(u.busyPermissionKeys) ? u.busyPermissionKeys.map(String) : undefined;

    return {
      id,
      email: String(u.email),
      displayName: String(u.displayName ?? u.email),
      legacyRole,
      profile: { displayName: u.displayName ?? "", photoUrl: u.photoUrl ?? null },
      busyRoleSlugs,
      busyPermissionKeys,
    };
  } catch {
    return null;
  }
}

/** Same resolution order as `getPlatformSession` (raw `Cookie` header, then parsed jar). */
function resolveAccountIdFromRequest(req: NextRequest): bigint | null {
  const raw = req.headers.get("cookie");
  const fromHeader =
    parseAccountId(readCookieValueFromHeader(raw, "bni_platform_account_id")) ??
    parseAccountId(readCookieValueFromHeader(raw, PLATFORM_ACCOUNT_REF_COOKIE));
  if (fromHeader) return fromHeader;

  return (
    parseAccountId(req.cookies.get("bni_platform_account_id")?.value) ??
    parseAccountId(req.cookies.get(PLATFORM_ACCOUNT_REF_COOKIE)?.value)
  );
}

/** Prefer JWT `/auth/me`. Cookie-only sessions without a bearer token are not resolved here. */
export async function getApiPlatformUser(req: NextRequest): Promise<ApiPlatformUser | null> {
  const jwtUser = await loadApiPlatformUserFromJwt(req);
  if (jwtUser) return jwtUser;

  const id = resolveAccountIdFromRequest(req);
  if (!id) return null;
  void id;
  return null;
}

export async function getApiPlatformUserWithBusyAuthz(req: NextRequest): Promise<ApiPlatformUserWithBusyAuthz | null> {
  const base = await getApiPlatformUser(req);
  if (!base) return null;
  if (base.busyRoleSlugs !== undefined && base.busyPermissionKeys !== undefined) {
    return {
      ...base,
      busyRoleSlugs: base.busyRoleSlugs,
      busyPermissionKeys: base.busyPermissionKeys,
    };
  }
  const authz = await fetchBusyAuthzForAccount(base.id);
  return { ...base, busyRoleSlugs: authz.roleSlugs, busyPermissionKeys: authz.permissionKeys };
}
