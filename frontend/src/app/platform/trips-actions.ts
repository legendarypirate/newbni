"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-session";
import { executeSaveTrip } from "@/lib/platform-trip-save-core";
import { serverAuthedFetch } from "@/lib/server-authed-fetch";

export async function saveTripAction(formData: FormData): Promise<void> {
  await connection();
  const session = await getPlatformSession();
  if (!session) {
    redirect("/auth/login?next=/platform/trips");
  }

  const accountId = BigInt(session.id);
  // executeSaveTrip still uses prisma. We should migrate this logic to the backend.
  // For now, I'll keep it but it's a target for next step.
  const result = await executeSaveTrip(accountId, formData);
  if (result.kind === "redirect") {
    redirect(result.to);
  }

  revalidatePath("/platform/trips");
  revalidatePath("/trips");
  redirect("/platform/trips");
}

export async function deleteTripAction(formData: FormData): Promise<void> {
  await connection();
  const session = await getPlatformSession();
  if (!session) {
    redirect("/auth/login?next=/platform/trips");
  }

  const tripId = String(formData.get("trip_id") ?? "0");
  if (tripId === "0") {
    redirect("/platform/trips");
  }

  try {
    await serverAuthedFetch(`/platform/trips/${tripId}`, { method: "DELETE" });
  } catch {
    redirect("/platform/trips");
  }

  revalidatePath("/platform/trips");
  revalidatePath("/trips");
  redirect("/platform/trips");
}

export async function toggleTripFeaturedAction(formData: FormData): Promise<void> {
  await connection();
  const session = await getPlatformSession();
  if (!session) {
    redirect("/auth/login?next=/platform/trips");
  }

  const tripId = String(formData.get("trip_id") ?? "0");
  const makeFeatured = String(formData.get("is_featured") ?? "0") === "1";
  if (tripId === "0") {
    redirect("/platform/trips");
  }

  try {
    const res = await serverAuthedFetch(`/platform/trips/${tripId}/toggle-featured`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: makeFeatured }),
    });
    if (!res.ok) {
       const out = await res.json().catch(() => ({}));
       if (out.errorKey === "featured_limit") {
         redirect("/platform/trips?error=featured_limit");
       }
       redirect("/platform/trips");
    }
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    redirect("/platform/trips");
  }

  revalidatePath("/platform/trips");
  revalidatePath("/trips");
  redirect("/platform/trips");
}
