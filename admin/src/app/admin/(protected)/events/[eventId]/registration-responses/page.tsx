import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import TripResponsesClient from "@/components/trip-registration/TripResponsesClient";
import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";
import { marketingSiteOrigin } from "@/lib/marketing-site-origin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ formId?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { eventId } = await params;
  const res = await serverAuthedFetch(`/events/${eventId}/registration-form-meta`)
    .then((r) => r.json())
    .catch(() => ({ ok: false }));
  const title = res.ok && res.event?.title ? String(res.event.title) : `Эвент #${eventId}`;
  return { title: `${title} — хариултууд | Админ` };
}

export default async function AdminEventRegistrationResponsesPage({ params, searchParams }: Props) {
  const { eventId: raw } = await params;
  const eventId = Number.parseInt(raw, 10);
  if (!Number.isFinite(eventId) || eventId < 1) notFound();

  const sp = await searchParams;
  const formIdParam = typeof sp.formId === "string" && sp.formId.length > 0 ? sp.formId : null;

  const metaRes = await serverAuthedFetch(`/events/${eventId}/registration-form-meta`)
    .then((r) => r.json())
    .catch(() => ({ ok: false }));
  if (!metaRes.ok) notFound();
  const title = String(metaRes.event?.title || "").trim() || `#${eventId}`;

  const formFromMeta = metaRes.form?.id ? String(metaRes.form.id) : null;
  const formId = formIdParam ?? formFromMeta;

  if (!formId) {
    return (
      <div>
        <nav className="mb-3">
          <Link href="/admin/meetings/manage" className="text-decoration-none small">
            ← Эвентүүд
          </Link>
        </nav>
        <h1 className="h4 fw-bold mb-3">{title} — хариултууд</h1>
        <div className="alert alert-warning mb-0">
          Энэ эвентэд бүртгэлийн форм байхгүй байна.
        </div>
      </div>
    );
  }

  if (!formIdParam && formFromMeta) {
    redirect(
      `/admin/events/${eventId}/registration-responses?formId=${encodeURIComponent(formFromMeta)}`,
    );
  }

  const formRes = await serverAuthedFetch(`/forms/${formId}`)
    .then((r) => r.json())
    .catch(() => null);
  if (!formRes?.form) {
    redirect("/admin/meetings/manage");
  }

  const formEventId = Number(formRes.form.eventId);
  if (Number.isFinite(formEventId) && formEventId > 0 && formEventId !== eventId) {
    notFound();
  }

  return (
    <div>
      <nav className="mb-3 d-flex flex-wrap align-items-center gap-2">
        <Link href="/admin/meetings/manage" className="text-decoration-none small">
          ← Эвентүүд
        </Link>
        <span className="text-muted small">/</span>
        <span className="small text-muted">{title}</span>
      </nav>

      <h1 className="h4 fw-bold mb-4">{title} — хариултууд</h1>

      <TripResponsesClient
        tripId={0}
        formId={formId}
        exportCsvHref={`/api/admin/events/${eventId}/registration-responses/export`}
        formEditorHref={`${marketingSiteOrigin()}/platform/events?edit_event=${eventId}`}
      />
    </div>
  );
}
