import type { PlatformRole } from "@/lib/platform-db-types";
import { headers } from "next/headers";
import { readBniTokenFromCookieHeader } from "@/lib/auth-cookie-token";
import { resolveServerApiBase } from "@/lib/resolve-api-base";
import { serverAuthedFetch } from "@/lib/server-authed-fetch";

/** Permission keys — keep stable; wire to `BusyPermission` after seeding. */
export const BUSY_PERMISSIONS = {
  weeklyMeetingManageOwn: "weekly_meeting.manage_own",
  weeklyMeetingManageAny: "weekly_meeting.manage_any",
  adminUsersRead: "admin.users.read",
} as const;

export type BusyPermissionKey = (typeof BUSY_PERMISSIONS)[keyof typeof BUSY_PERMISSIONS];

export const BUSY_ROLE_SLUGS = {
  guest: "guest",
  registeredUser: "registered_user",
  businessMember: "business_member",
  organizer: "organizer",
  supplier: "supplier",
  investor: "investor",
  admin: "admin",
  superAdmin: "super_admin",
} as const;

export function legacyRoleCanManageAnyWeeklyMeeting(role: PlatformRole): boolean {
  return role === "admin" || role === "director";
}

export function accountCanManageWeeklyMeetingSnapshot(
  accountId: bigint,
  organizerAccountId: bigint,
  legacyRole: string,
  busyPermissionKeys: readonly string[],
): boolean {
  if (organizerAccountId === accountId) return true;
  if (legacyRoleCanManageAnyWeeklyMeeting(legacyRole as PlatformRole)) return true;
  return busyPermissionKeys.includes(BUSY_PERMISSIONS.weeklyMeetingManageAny);
}

async function fetchMeForWeeklyGate(): Promise<{ role: string; busyPermissionKeys: string[] } | null> {
  const h = await headers();
  const cookieHeader = h.get("cookie");
  const hdrs = new Headers();
  if (cookieHeader) hdrs.set("cookie", cookieHeader);
  const tok = readBniTokenFromCookieHeader(cookieHeader);
  if (tok) hdrs.set("Authorization", `Bearer ${tok}`);
  try {
    const res = await fetch(`${resolveServerApiBase()}/auth/me`, { headers: hdrs, cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: { role?: string; busyPermissionKeys?: unknown };
    };
    const u = data.user;
    if (!u) return null;
    const keys = Array.isArray(u.busyPermissionKeys) ? u.busyPermissionKeys.map(String) : [];
    return { role: String(u.role ?? ""), busyPermissionKeys: keys };
  } catch {
    return null;
  }
}

/** MVP: platform admin/director, or meeting group owner, or explicit RBAC assignment (via `/auth/me`). */
export async function accountCanManageWeeklyMeeting(accountId: bigint, organizerAccountId: bigint): Promise<boolean> {
  const me = await fetchMeForWeeklyGate();
  if (!me) return false;
  return accountCanManageWeeklyMeetingSnapshot(accountId, organizerAccountId, me.role, me.busyPermissionKeys);
}

/** Non-visitor legacy roles may create weekly meetings (MVP gate before Busy RBAC UI). */
export function canAccountCreateWeeklyMeeting(legacyRole: PlatformRole): boolean {
  return legacyRole !== "visitor";
}

export type BusyAuthzSnapshot = {
  roleSlugs: string[];
  permissionKeys: string[];
};

/** Busy role slugs + permission keys from `/auth/me` (requires bearer token). */
export async function fetchBusyAuthzForAccount(accountId: bigint): Promise<BusyAuthzSnapshot> {
  const h = await headers();
  const cookieHeader = h.get("cookie");
  const hdrs = new Headers();
  if (cookieHeader) hdrs.set("cookie", cookieHeader);
  const tok = readBniTokenFromCookieHeader(cookieHeader);
  if (!tok) return { roleSlugs: [], permissionKeys: [] };
  hdrs.set("Authorization", `Bearer ${tok}`);
  try {
    const res = await fetch(`${resolveServerApiBase()}/auth/me`, { headers: hdrs, cache: "no-store" });
    if (!res.ok) return { roleSlugs: [], permissionKeys: [] };
    const data = (await res.json()) as {
      user?: { id?: string | number; busyRoleSlugs?: unknown; busyPermissionKeys?: unknown };
    };
    const u = data.user;
    if (!u || String(u.id) !== String(accountId)) return { roleSlugs: [], permissionKeys: [] };
    return {
      roleSlugs: Array.isArray(u.busyRoleSlugs) ? u.busyRoleSlugs.map(String) : [],
      permissionKeys: Array.isArray(u.busyPermissionKeys) ? u.busyPermissionKeys.map(String) : [],
    };
  } catch {
    return { roleSlugs: [], permissionKeys: [] };
  }
}

/** Idempotent Busy RBAC seed — backend. */
export async function ensureBusyRbacSeed(): Promise<void> {
  try {
    const res = await serverAuthedFetch("/admin/system/ensure-busy-rbac-seed", { method: "POST" });
    if (!res.ok) return;
  } catch {
    /* ignore — parity with legacy seed helper */
  }
}

/** Idempotent organizer assignment — backend. */
export async function ensureOrganizerRoleForEligibleAccount(accountId: bigint): Promise<void> {
  try {
    const res = await serverAuthedFetch(`/admin/platform-accounts/${accountId.toString()}/ensure-organizer`, {
      method: "POST",
    });
    if (!res.ok) return;
  } catch {
    /* non-fatal */
  }
}
