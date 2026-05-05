import { headers } from "next/headers";
import { readBniTokenFromCookieHeader } from "@admin/lib/auth-cookie-token";
import { resolveServerApiBase } from "@admin/lib/resolve-api-base";
import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";

type PlatformRole = string;

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

/** Snapshot-based gate (preferred): actor auth comes from `/auth/me`. */
export function accountCanManageWeeklyMeetingSnapshot(
  accountId: bigint,
  organizerAccountId: bigint,
  legacyRole: string,
  busyPermissionKeys: readonly string[],
): boolean {
  if (organizerAccountId === accountId) return true;
  if (legacyRoleCanManageAnyWeeklyMeeting(legacyRole)) return true;
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

/** Weekly meeting helpers: resolves current actor via backend `/auth/me` (no Prisma). */
export async function accountCanManageWeeklyMeeting(accountId: bigint, organizerAccountId: bigint): Promise<boolean> {
  const me = await fetchMeForWeeklyGate();
  if (!me) return false;
  return accountCanManageWeeklyMeetingSnapshot(accountId, organizerAccountId, me.role, me.busyPermissionKeys);
}

/** Non-visitor legacy roles may create weekly meetings (MVP gate before Busy RBAC UI). */
export function canAccountCreateWeeklyMeeting(legacyRole: PlatformRole): boolean {
  return legacyRole !== "visitor";
}

/** Idempotent Busy RBAC seed — runs on backend. */
export async function ensureBusyRbacSeed(): Promise<void> {
  try {
    const res = await serverAuthedFetch("/admin/system/ensure-busy-rbac-seed", { method: "POST" });
    if (!res.ok) return;
  } catch {
    /* ignore */
  }
}

/** Idempotent organizer role for non-visitor accounts — runs on backend. */
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
