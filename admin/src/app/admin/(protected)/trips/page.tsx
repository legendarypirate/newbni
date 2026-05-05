import Link from "next/link";
import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";

export const metadata = { title: "Trips | Admin" };

type TripRow = {
  id: number;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  statusLabel: string | null;
  priceMnt: string | number | null;
};

async function loadTrips(): Promise<{ ok: boolean; rows: TripRow[] }> {
  try {
    const res = await serverAuthedFetch("/platform/trips");
    const data = (await res.json().catch(() => ({}))) as { trips?: unknown };
    const raw = Array.isArray(data.trips) ? data.trips : [];
    const rows: TripRow[] = raw
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((r) => ({
        id: Number(r.id ?? 0),
        destination: (r.destination as string | null) ?? null,
        startDate: (r.startDate as string | null) ?? null,
        endDate: (r.endDate as string | null) ?? null,
        statusLabel: (r.statusLabel as string | null) ?? null,
        priceMnt: (r.priceMnt as string | number | null) ?? null,
      }));
    return { ok: res.ok, rows };
  } catch {
    return { ok: false, rows: [] };
  }
}

function fmtDate(v: string | null): string {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
}

function fmtMoney(v: string | number | null): string {
  if (v == null || v === "") return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return `₮${Math.round(n).toLocaleString("en-US")}`;
}

export default async function AdminTripsPage() {
  const { ok, rows } = await loadTrips();

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h1 className="h4 fw-bold mb-0">Business Trips</h1>
        <Link href="/admin/trips?new=1" className="btn btn-primary btn-sm">
          New Trip
        </Link>
      </div>

      {!ok ? <div className="alert alert-danger">Backend API unavailable. Check backend deploy/PM2.</div> : null}

      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Destination</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Price</th>
              <th className="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted">
                  No data
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.destination || "-"}</td>
                  <td>{fmtDate(r.startDate)}</td>
                  <td>{fmtDate(r.endDate)}</td>
                  <td>{r.statusLabel || "-"}</td>
                  <td>{fmtMoney(r.priceMnt)}</td>
                  <td className="text-end">
                    <Link href={`/admin/trips/${r.id}/registration-responses`} className="btn btn-sm btn-outline-secondary">
                      Responses
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
