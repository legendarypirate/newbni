import Link from "next/link";
import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";

export const metadata = { title: "Хурлууд | Админ" };

export default async function AdminBniEventsPage() {
  const res = await serverAuthedFetch("/events").catch(() => null);
  const data = (res ? await res.json().catch(() => ({})) : {}) as {
    events?: Array<{
      id: string;
      eventType: string;
      chapterName?: string | null;
      startsAt: string;
      endsAt: string;
    }>;
  };
  const rows = Array.isArray(data.events) ? data.events : [];

  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Хурлууд</h1>
      {!res || !res.ok ? <div className="alert alert-danger">Backend API unavailable.</div> : null}
      <p className="text-muted small mb-3">
        <code>bni_events</code> — жагсаалт. Календар / засварын UI дараа нь.
      </p>
      <div className="table-responsive">
        <table className="table table-hover table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Бүлэг</th>
              <th>Төрөл</th>
              <th>Эхлэх</th>
              <th>Дуусах</th>
              <th className="text-end" style={{ width: "1%" }}>
                Үйлдэл
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)}>
                <td>{String(r.id)}</td>
                <td>{r.chapterName ?? "—"}</td>
                <td className="small">{r.eventType}</td>
                <td className="small">{String(r.startsAt).slice(0, 16)}</td>
                <td className="small">{String(r.endsAt).slice(0, 16)}</td>
                <td className="text-end text-nowrap">
                  <Link
                    href={`/admin/events/${String(r.id)}/registration-responses`}
                    className="btn btn-sm btn-outline-secondary px-2 py-1 lh-sm border rounded-2 shadow-sm"
                    title="Хариултууд (хүснэг)"
                    aria-label="Хариултууд"
                  >
                    <i className="fas fa-table" style={{ fontSize: "0.85rem" }} aria-hidden />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
