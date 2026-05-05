"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformUserManagement } from "@/lib/admin-access";
import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";

type EditableRole =
  | "visitor"
  | "member"
  | "director"
  | "admin"
  | "super_admin"
  | "trip_manager"
  | "event_manager";

const ROLES: EditableRole[] = [
  "visitor",
  "member",
  "director",
  "admin",
  "super_admin",
  "trip_manager",
  "event_manager",
];

const CREATABLE_ROLES: EditableRole[] = [
  "trip_manager",
  "event_manager",
  "visitor",
  "member",
  "director",
  "admin",
];

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function createPlatformStaffUserAction(formData: FormData): Promise<void> {
  await requirePlatformUserManagement("/admin/bni-platform-users");
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const displayNameRaw = String(formData.get("display_name") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "").trim() as EditableRole;

  if (!email || !password || !CREATABLE_ROLES.includes(roleRaw)) {
    redirect("/admin/bni-platform-users?create=invalid");
  }
  if (password.length < 8) {
    redirect("/admin/bni-platform-users?create=weak_password");
  }

  const res = await serverAuthedFetch("/admin/platform-accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      display_name: displayNameRaw || undefined,
      role: roleRaw,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { errorKey?: string };

  if (res.status === 409 || data.errorKey === "email_taken") {
    redirect("/admin/bni-platform-users?create=email_taken");
  }
  if (!res.ok) {
    if (data.errorKey === "weak_password") {
      redirect("/admin/bni-platform-users?create=weak_password");
    }
    redirect("/admin/bni-platform-users?create=invalid");
  }

  revalidatePath("/admin/bni-platform-users");
  redirect("/admin/bni-platform-users?create=ok");
}

export async function updatePlatformAccountRoleAction(formData: FormData): Promise<void> {
  await requirePlatformUserManagement("/admin/bni-platform-users");
  const idStr = String(formData.get("account_id") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "").trim() as EditableRole;
  if (!idStr || !ROLES.includes(roleRaw)) redirect("/admin/bni-platform-users");

  const res = await serverAuthedFetch(`/admin/platform-accounts/${idStr}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: roleRaw }),
  });

  if (!res.ok) {
    redirect("/admin/bni-platform-users");
  }

  revalidatePath("/admin/bni-platform-users");
  redirect("/admin/bni-platform-users");
}
