"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { executeSaveTrip } from "@/lib/platform-trip-save-core";
import { serverAuthedFetch } from "@/lib/server-authed-fetch";

/**
 * Trip mutations forward the caller's JWT (extracted from cookies inside
 * `serverAuthedFetch`) to the backend. Authentication is enforced by the
 * Node API; we never redirect to `/auth/login` from here — the
 * `PlatformAuthGate` client component handles "logged out" UX.
 *
 * If the cookie is missing the request will return 401 and the panel can
 * surface a banner instead of a hard redirect.
 */
export async function saveTripAction(formData: FormData): Promise<void> {
  await connection();
  // accountId argument is unused by `executeSaveTrip`; pass BigInt(0) to keep the signature.
  const result = await executeSaveTrip(BigInt(0), formData);
  if (result.kind === "redirect") {
    redirect(result.to);
  }

  revalidatePath("/platform/trips");
  revalidatePath("/trips");
  redirect("/platform/trips");
}

export async function deleteTripAction(formData: FormData): Promise<void> {
  await connection();

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
