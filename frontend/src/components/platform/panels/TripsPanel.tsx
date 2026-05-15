"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import TripEditorForm from "@/components/platform/trips/TripEditorForm";
import ApprovalStatusBadge from "@/components/platform/ApprovalStatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { apiFetch } from "@/lib/api-client";
import { publicApiBase as resolveApiBase } from "@/lib/client-api-base";
import {
  errorBanner,
  fmtMoney,
  toInputDate,
} from "@/components/platform/trips/trip-editor-helpers";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

type ManagedTripRow = {
  id: number;
  destination: string;
  seatsLabel?: string | null;
  startDate: Date;
  endDate: Date;
  priceMnt?: number | string | null;
  isFeatured: number;
  statusLabel?: string | null;
  formIsPublished?: boolean;
};

function toManagedTripRow(row: Record<string, unknown>): ManagedTripRow {
  return {
    id: Number(row.id ?? 0),
    destination: String(row.destination ?? ""),
    seatsLabel: row.seatsLabel == null ? null : String(row.seatsLabel),
    startDate: new Date(String(row.startDate ?? row.start_date ?? "")),
    endDate: new Date(String(row.endDate ?? row.end_date ?? "")),
    priceMnt: row.priceMnt == null ? null : (row.priceMnt as number | string),
    isFeatured: Number(row.isFeatured ?? row.is_featured ?? 0),
    statusLabel: row.statusLabel == null ? null : String(row.statusLabel),
    formIsPublished: Boolean(row.formIsPublished ?? row.form_is_published),
  };
}

export default function TripsPanel({ searchParams: _searchParams }: Props) {
  const qp = useSearchParams();
  const [greetingName, setGreetingName] = useState("Та");
  const [managedTrips, setManagedTrips] = useState<ManagedTripRow[]>([]);
  const [editTrip, setEditTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<ManagedTripRow | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [flash, setFlash] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const err = errorBanner(qp.get("error") ?? undefined);
  const editRaw = qp.get("edit_trip") ?? qp.get("edit") ?? "";
  const editTripId = Math.max(0, Number(editRaw));

  async function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setBusyId(id);
    try {
      const res = await apiFetch(`/platform/trips/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setFlash({ kind: "err", text: "Устгах үед алдаа гарлаа." });
        return;
      }
      setManagedTrips((prev) => prev.filter((t) => t.id !== id));
      setFlash({ kind: "ok", text: "Аяллыг устгалаа." });
      setPendingDelete(null);
    } catch {
      setFlash({ kind: "err", text: "Сүлжээний алдаа." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleFeatured(row: ManagedTripRow) {
    const id = row.id;
    const next = row.isFeatured === 1 ? 0 : 1;
    setBusyId(id);
    try {
      const res = await apiFetch(`/platform/trips/${id}/toggle-featured`, {
        method: "POST",
        body: JSON.stringify({ isFeatured: Boolean(next) }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { errorKey?: string };
        setFlash({
          kind: "err",
          text: data.errorKey === "featured_limit"
            ? "Онцлох аялал дээд тал нь 3 байж болно."
            : "Шинэчлэх үед алдаа гарлаа.",
        });
        return;
      }
      setManagedTrips((prev) => prev.map((t) => (t.id === id ? { ...t, isFeatured: next } : t)));
      setFlash({ kind: "ok", text: next === 1 ? "Онцлох аяллыг идэвхжүүлэв." : "Онцлохыг буулгав." });
    } catch {
      setFlash({ kind: "err", text: "Сүлжээний алдаа." });
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 3500);
    return () => clearTimeout(t);
  }, [flash]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const meRes = await apiFetch("/auth/me");
        if (meRes.ok) {
          const meData = (await meRes.json()) as { user?: { displayName?: string } };
          const name = meData.user?.displayName?.trim();
          if (!cancelled && name) setGreetingName(name);
        }

        const tripsRes = await apiFetch("/platform/trips?mine=1");
        if (tripsRes.ok) {
          const json = (await tripsRes.json()) as {
            trips?: Array<Record<string, unknown>>;
            data?: { trips?: Array<Record<string, unknown>> };
          };
          // Backend wraps payload as `{ ok, data: { trips, ... } }`; tolerate
          // either shape so older deployments don't break the UI.
          const list = json.data?.trips ?? json.trips ?? [];
          if (!cancelled) setManagedTrips(list.map(toManagedTripRow));
        } else if (!cancelled) {
          setManagedTrips([]);
        }

        if (editTripId > 0) {
          const editTripRes = await apiFetch(`/platform/trips/${editTripId}`);
          if (!cancelled) {
            if (editTripRes.ok) {
              const data = (await editTripRes.json()) as { trip?: unknown };
              setEditTrip(data.trip ?? null);
            } else {
              setEditTrip(null);
            }
          }
        } else if (!cancelled) {
          setEditTrip(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [editTripId, reloadTick]);

  if (!loading && editTripId > 0 && !editTrip) {
    return (
      <div className="pl-panel-inner px-3 py-4">
        <div className="alert alert-warning">{errorBanner("notfound")}</div>
        <Link href="/platform/trips">Жагсаалт руу</Link>
      </div>
    );
  }

  return (
    <div className="pl-panel-inner px-3 py-4">
      {err ? <div className="alert alert-warning py-2 small mb-3">{err}</div> : null}
      {flash ? (
        <div
          className={`alert py-2 small mb-3 ${flash.kind === "ok" ? "alert-success" : "alert-danger"}`}
          role="status"
        >
          {flash.text}
        </div>
      ) : null}

      {/* --- Managed trips (PHP order: card first) --- */}
      <div className="pm-card mb-4" id="managedTripsCard">
        <div className="pm-card-header d-flex justify-content-between align-items-center">
          <div>
            <div className="pm-card-title">Миний аяллууд</div>
            <div className="pm-card-subtitle">Онцлох аялал дээд тал нь 3 байж болно.</div>
          </div>
          <Link href="/platform/trips" className="btn btn-sm btn-outline-primary">
            <i className="fa-solid fa-plus me-1" />
            Шинэ аялал
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Аялал</th>
                <th>Огноо</th>
                <th>Үнэ</th>
                <th>Зөвшөөрөл</th>
                <th>Онцлох</th>
                <th className="text-end">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {managedTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    Аялал бүртгэгдээгүй байна.
                  </td>
                </tr>
              ) : (
                managedTrips.map((mt) => (
                  <tr key={mt.id}>
                    <td>
                      <div className="fw-semibold">{mt.destination}</div>
                      <div className="small text-muted">{mt.seatsLabel?.trim() || ""}</div>
                    </td>
                    <td className="small text-muted">
                      {toInputDate(mt.startDate)} — {toInputDate(mt.endDate)}
                    </td>
                    <td>{fmtMoney(mt.priceMnt)}</td>
                    <td>
                      <ApprovalStatusBadge statusLabel={mt.statusLabel} formPublished={mt.formIsPublished} />
                    </td>
                    <td>
                      {mt.isFeatured === 1 ? (
                        <span className="badge bg-warning text-dark">
                          <i className="fa-solid fa-star me-1" />
                          Онцлох
                        </span>
                      ) : (
                        <span className="badge bg-light text-muted">Энгийн</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex flex-wrap gap-2 justify-content-end">
                        <button
                          type="button"
                          className={`btn btn-sm ${mt.isFeatured === 1 ? "btn-outline-secondary" : "btn-outline-warning"}`}
                          disabled={busyId === mt.id}
                          onClick={() => handleToggleFeatured(mt)}
                        >
                          {mt.isFeatured === 1 ? "Онцлолоос буулгах" : "Онцлох болгох"}
                        </button>
                        <Link href={`/platform/trips?edit_trip=${mt.id}`} className="btn btn-sm btn-outline-primary">
                          Засах
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={busyId === mt.id}
                          onClick={() => setPendingDelete(mt)}
                          aria-label={`Аяллыг устгах: ${mt.destination}`}
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Approved attendees placeholder (parity shell) --- */}
      <div className="pm-card mb-4" id="approvedTripAttendeesCard">
        <div className="pm-card-header d-flex justify-content-between align-items-center">
          <div>
            <div className="pm-card-title">Зөвшөөрсөн оролцогчдын жагсаалт</div>
            <div className="pm-card-subtitle">Төлөв, төлбөрийн мэдээлэлтэй оролцогчид.</div>
          </div>
          <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">Нийт 0</span>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Оролцогч</th>
                <th>Аялал</th>
                <th>Компани / Салбар</th>
                <th>Утас / Email</th>
                <th>Төлөв</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted">
                  Оролцогчдын өгөгдөл энд харагдана (legacy хүснэгттэй уялдуулна).
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <TripEditorForm
        key={editTripId > 0 ? `trip-editor-${editTripId}` : "trip-editor-new"}
        greetingName={greetingName}
        editTrip={editTrip}
        formAction={`${resolveApiBase()}/platform/trips/save`}
        tripsIndexHref="/platform/trips"
        tripsIndexLabel="Аялал"
        onSaved={() => setReloadTick((x) => x + 1)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        tone="danger"
        title="Аяллыг устгах уу?"
        message={
          <>
            <strong>{pendingDelete?.destination ?? ""}</strong> аяллыг бүрмөсөн устгана.
            Энэ үйлдлийг буцаах боломжгүй.
          </>
        }
        confirmLabel="Устгах"
        cancelLabel="Болих"
        busy={busyId === pendingDelete?.id}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (busyId !== null) return;
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
