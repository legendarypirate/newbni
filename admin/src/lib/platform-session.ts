import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { apiFetch } from "./api-client";

export type PlatformUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  photoUrl: string | null;
};

export async function getPlatformSession(): Promise<PlatformUser | null> {
  try {
    const h = await headers();
    const res = await apiFetch("/auth/me", {}, h.get("cookie") ?? undefined);
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function requireAdminUser(): Promise<PlatformUser> {
  const u = await getPlatformSession();
  if (!u || u.role !== "admin") {
    redirect("/login?error=unauthorized");
  }
  return u;
}
