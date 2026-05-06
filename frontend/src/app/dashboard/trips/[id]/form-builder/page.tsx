import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import TripFormsHubClient from "@/components/trip-registration/TripFormsHubClient";
import { requirePlatformUser } from "@/lib/platform-session";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

import { serverAuthedFetch } from "@/lib/server-authed-fetch";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const res = await serverAuthedFetch(`/trips/${id}`).then(r => r.json()).catch(() => ({ ok: false }));
  const trip = res.ok ? res.trip : null;
  return { title: trip ? `${trip.destination} — бүртгэлийн форм` : "Бүртгэлийн форм" };
}

export default async function TripFormBuilderPage({ params }: Props) {
  const { id } = await params;
  const tripId = id;

  const nextPath = `/dashboard/trips/${tripId}/form-builder`;
  const user = await requirePlatformUser(nextPath);

  const res = await serverAuthedFetch(`/trips/${tripId}`).then(r => r.json()).catch(() => ({ ok: false }));
  if (!res.ok) notFound();
  const trip = res.trip;

  // Ownership check is implicitly handled by the backend /api/trips/:id or subsequent calls
  // But if we want to be explicit, we can check if the backend returned it successfully for this user.

  return (
    <DashboardPage>
      <DashboardBreadcrumb
        className="mb-3"
        items={[
          { label: "Аялалууд", href: "/dashboard/trips" },
          { label: trip.destination },
        ]}
      />

      <h1 className="text-base font-semibold tracking-tight text-foreground">{trip.destination}</h1>
      <p className="mb-4 text-xs text-muted-foreground">Бүртгэлийн форм</p>

      <TripFormsHubClient tripId={Number(tripId)} />
    </DashboardPage>
  );
}
