"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-session";
import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";

function slugifyChapter(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 190);
  return base || `chapter-${Date.now().toString(36)}`;
}

export async function saveChapterAction(formData: FormData): Promise<void> {
  await requireAdminUser("/admin/bni-chapters");
  const regionId = Math.max(0, parseInt(String(formData.get("region_id") ?? "0"), 10) || 0);
  const name = String(formData.get("name") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const maxMembers = Math.min(500, Math.max(1, parseInt(String(formData.get("max_members") ?? "40"), 10) || 40));
  const timezone = String(formData.get("timezone") ?? "").trim() || "Asia/Ulaanbaatar";

  if (name === "" || regionId < 1) {
    redirect("/admin/bni-chapters?error=missing");
  }
  if (slug === "") slug = slugifyChapter(name);

  await serverAuthedFetch("/admin/chapters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      regionId,
      name: name.slice(0, 190),
      slug: slug.slice(0, 190),
      maxMembers,
      timezone: timezone.slice(0, 64),
    }),
  });

  revalidatePath("/admin/bni-chapters");
  revalidatePath("/admin/meetings");
  revalidatePath("/platform/events");
  redirect("/admin/bni-chapters");
}
