"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-session";
import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 190);
  return base || `region-${Date.now().toString(36)}`;
}

export async function saveRegionAction(formData: FormData): Promise<void> {
  await requireAdminUser("/admin/bni-regions");
  const idRaw = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const sortOrder = Math.max(0, parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0);

  if (name === "") {
    redirect("/admin/bni-regions");
  }
  if (slug === "") slug = slugify(name);

  if (idRaw !== "") {
    const id = parseInt(idRaw, 10);
    if (Number.isFinite(id) && id > 0) {
      await serverAuthedFetch("/admin/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, slug, sortOrder }),
      });
    }
  } else {
    await serverAuthedFetch("/admin/regions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, sortOrder }),
    });
  }
  revalidatePath("/admin/bni-regions");
  redirect("/admin/bni-regions");
}

export async function deleteRegionAction(formData: FormData): Promise<void> {
  await requireAdminUser("/admin/bni-regions");
  const id = parseInt(String(formData.get("id") ?? ""), 10);
  if (!Number.isFinite(id) || id <= 0) redirect("/admin/bni-regions");
  await serverAuthedFetch(`/admin/regions/${id}`, { method: "DELETE" }).catch(() => undefined);
  revalidatePath("/admin/bni-regions");
  redirect("/admin/bni-regions");
}
