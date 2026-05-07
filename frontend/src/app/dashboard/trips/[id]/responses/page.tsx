import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import TripResponsesClient from "@/components/trip-registration/TripResponsesClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ formId?: string }>;
};

import { serverAuthedFetch } from "@/lib/server-authed-fetch";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const res = await serverAuthedFetch(`/trips/${id}`).then(r => r.json()).catch(() => ({ ok: false }));
  const trip = res.ok ? res.trip : null;
  return { title: trip ? `${trip.destination} — хариултууд` : "Хариултууд" };
}

export default async function TripResponsesPage({ params, searchParams }: Props) {
  const { id } = await params;
  const tripId = id;

  const sp = await searchParams;
  const formId = typeof sp.formId === "string" && sp.formId.length > 0 ? sp.formId : null;

  // Auth is enforced by `DashboardAuthGate` in the layout; this page just
  // fetches data and lets the backend reject unauthenticated requests.
  const tripRes = await serverAuthedFetch(`/trips/${tripId}`).then(r => r.json()).catch(() => ({ ok: false }));
  if (!tripRes.ok) notFound();
  const trip = tripRes.trip;

  if (!formId) {
    const formsRes = await serverAuthedFetch(`/trips/${tripId}/forms`).then(r => r.json()).catch(() => ({ ok: false }));
    const first = formsRes.ok && formsRes.forms?.length > 0 ? formsRes.forms[0] : null;
    if (first) {
      redirect(`/dashboard/trips/${tripId}/responses?formId=${encodeURIComponent(first.id)}`);
    }
    return (
      <DashboardPage maxWidthClass="max-w-xl">
        <p className="mb-2 text-sm text-muted-foreground">Энэ аялалд бүртгэлийн форм байхгүй байна.</p>
        <Link href={`/dashboard/trips/${tripId}/form-builder`} className="text-sm font-semibold text-primary hover:underline">
          Форм үүсгэх
        </Link>
      </DashboardPage>
    );
  }

  // Permission check is handled by the backend API call in TripResponsesClient
  // But we can do a quick check here if needed via /api/forms/:id
  const formRes = await serverAuthedFetch(`/forms/${formId}`).then(r => r.json()).catch(() => ({ ok: false }));
  if (!formRes.ok) {
    redirect("/dashboard/trips");
  }

  return (
    <DashboardPage>
      <DashboardBreadcrumb
        className="mb-3"
        items={[
          { label: "Аялалууд", href: "/dashboard/trips" },
          { label: `${trip.destination} — хариултууд` },
        ]}
      />

      <h1 className="mb-4 text-base font-semibold tracking-tight text-foreground">Хариултууд</h1>

      <TripResponsesClient tripId={Number(tripId)} formId={formId} />
    </DashboardPage>
  );
}
