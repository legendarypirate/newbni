import { connection } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";

export const metadata = { title: "Meetings | Admin" };
export const dynamic = "force-dynamic";

type AdminEventRow = {
  id: string;
  title: string | null;
  eventType: string;
  startsAt: string;
  location: string | null;
  chapter?: { name?: string } | null;
};

async function loadRows(): Promise<{ ok: boolean; rows: AdminEventRow[] }> {
  try {
    const res = await serverAuthedFetch("/admin/events/bootstrap");
    const data = (await res.json().catch(() => ({}))) as { managedEvents?: unknown };
    const raw = Array.isArray(data.managedEvents) ? data.managedEvents : [];
    const rows: AdminEventRow[] = raw
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((r) => ({
        id: String(r.id ?? ""),
        title: (r.title as string | null) ?? null,
        eventType: String(r.eventType ?? ""),
        startsAt: String(r.startsAt ?? ""),
        location: (r.location as string | null) ?? null,
        chapter: r.chapter && typeof r.chapter === "object" ? (r.chapter as { name?: string }) : null,
      }));
    return { ok: res.ok, rows };
  } catch {
    return { ok: false, rows: [] };
  }
}

function fmt(v: string): string {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminMeetingsPage() {
  await connection();
  noStore();
  const { ok, rows } = await loadRows();

  return (
    <div>
      <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h1 className="h4 fw-bold mb-1">Meetings</h1>
          <p className="text-muted small mb-0">Admin API backed list.</p>
        </div>
        <Link href="/admin/bni-events" className="btn btn-sm btn-outline-primary">
          Open BNI Events
        </Link>
      </div>

      {!ok ? <div className="alert alert-danger">Backend API unavailable. Check backend deploy/PM2.</div> : null}

      <div className="table-responsive">
        <table className="table table-sm table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Chapter</th>
              <th>Type</th>
              <th>Starts</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  No data
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id || `row-${r.startsAt}`}>
                  <td>{r.id || "-"}</td>
                  <td>{r.title || "-"}</td>
                  <td>{r.chapter?.name || "-"}</td>
                  <td>{r.eventType || "-"}</td>
                  <td>{fmt(r.startsAt)}</td>
                  <td>{r.location || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
