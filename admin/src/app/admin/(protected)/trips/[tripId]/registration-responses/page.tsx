import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import TripResponsesClient, { type TripFormResponseRow } from "@/components/trip-registration/TripResponsesClient";
import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";
import { marketingSiteOrigin } from "@/lib/marketing-site-origin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ formId?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { tripId } = await params;
  const res = await serverAuthedFetch(`/platform/trips/${tripId}`)
    .then((r) => r.json())
    .catch(() => ({ ok: false }));
  const trip = res.ok ? res.trip : null;
  const label = trip?.destination ? String(trip.destination) : `Аялал #${tripId}`;
  return { title: `${label} — хариултууд | Админ` };
}

export default async function AdminTripRegistrationResponsesPage({ params, searchParams }: Props) {
  const { tripId: raw } = await params;
  const tripId = Number.parseInt(raw, 10);
  if (!Number.isFinite(tripId) || tripId < 1) notFound();

  const sp = await searchParams;
  const formIdParam = typeof sp.formId === "string" && sp.formId.length > 0 ? sp.formId : null;

  const tripRes = await serverAuthedFetch(`/platform/trips/${tripId}`)
    .then((r) => r.json())
    .catch(() => ({ ok: false }));
  if (!tripRes.ok) notFound();
  const destination = String(tripRes.trip?.destination || "").trim() || `#${tripId}`;

  if (!formIdParam) {
    const formsRes = await serverAuthedFetch(`/trips/${tripId}/forms`)
      .then((r) => r.json())
      .catch(() => ({ forms: [] as { id?: string }[] }));
    const first =
      Array.isArray(formsRes.forms) && formsRes.forms.length > 0 ? formsRes.forms[0] : null;
    if (first?.id) {
      redirect(
        `/admin/trips/${tripId}/registration-responses?formId=${encodeURIComponent(first.id)}`,
      );
    }
    return (
      <div>
        <nav className="mb-3">
          <Link href="/admin/trips" className="text-decoration-none small">
            ← Аялалууд
          </Link>
        </nav>
        <h1 className="h4 fw-bold mb-3">{destination} — хариултууд</h1>
        <div className="alert alert-warning mb-0">
          Энэ аялалд бүртгэлийн форм байхгүй байна.
        </div>
      </div>
    );
  }

  const formRes = await serverAuthedFetch(`/forms/${formIdParam}`)
    .then((r) => r.json())
    .catch(() => null);
  if (!formRes?.form) {
    redirect("/admin/trips");
  }

  const formTripId = Number(formRes.form.tripId);
  if (Number.isFinite(formTripId) && formTripId > 0 && formTripId !== tripId) {
    notFound();
  }

  const responsesRes = await serverAuthedFetch(`/forms/${encodeURIComponent(formIdParam)}/responses`);
  const responsesJson = responsesRes.ok
    ? ((await responsesRes.json().catch(() => ({}))) as { responses?: TripFormResponseRow[] })
    : null;
  const initialRows = Array.isArray(responsesJson?.responses) ? responsesJson.responses : undefined;

  return (
    <div>
      <nav className="mb-3 d-flex flex-wrap align-items-center gap-2">
        <Link href="/admin/trips" className="text-decoration-none small">
          ← Аялалууд
        </Link>
        <span className="text-muted small">/</span>
        <span className="small text-muted">{destination}</span>
      </nav>

      <h1 className="h4 fw-bold mb-4">{destination} — хариултууд</h1>

      <TripResponsesClient
        tripId={tripId}
        formId={formIdParam}
        useAdminProxy
        initialRows={initialRows}
        exportCsvHref={`/api/admin/trips/${tripId}/registration-responses/export`}
        formEditorHref={`${marketingSiteOrigin()}/platform/trips?edit_trip=${tripId}`}
      />
    </div>
  );
}
