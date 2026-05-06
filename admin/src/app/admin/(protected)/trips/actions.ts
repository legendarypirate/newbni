"use server";

import { connection } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-session";
import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";

export async function adminDeleteTripAction(formData: FormData): Promise<void> {
  await connection();
  await requireAdminUser("/admin/trips");

  const tripId = Math.max(0, Number(String(formData.get("trip_id") ?? "0")));
  if (tripId < 1) {
    redirect("/admin/trips");
  }

  await serverAuthedFetch(`/platform/trips/${tripId}`, { method: "DELETE" }).catch(() => null);

  revalidatePath("/admin/trips");
  revalidatePath("/trips");
  revalidatePath("/platform/trips");
  redirect("/admin/trips");
}
