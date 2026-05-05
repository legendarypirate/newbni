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
