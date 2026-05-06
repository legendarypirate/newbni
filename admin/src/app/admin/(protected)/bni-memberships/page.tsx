import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";

export const metadata = { title: "Гишүүн эрх | Админ" };

export default async function AdminBniMembershipsPage() {
  const res = await serverAuthedFetch("/admin/bni-memberships").catch(() => null);
  const data = (res ? await res.json().catch(() => ({})) : {}) as {
    rows?: Array<{ id: string; status: string; account?: { email?: string }; chapter?: { name?: string } }>;
  };
  const rows = Array.isArray(data.rows) ? data.rows : [];

  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Гишүүн эрх</h1>
      {!res || !res.ok ? <div className="alert alert-danger">Backend API unavailable.</div> : null}
      <p className="text-muted small mb-3">
        <code>bni_chapter_memberships</code> — сүүлийн 200 мөр.
      </p>
      <div className="table-responsive">
        <table className="table table-hover table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имэйл</th>
              <th>Бүлэг</th>
              <th>Төлөв</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)}>
                <td>{String(r.id)}</td>
                <td className="small">{r.account?.email ?? "-"}</td>
                <td>{r.chapter?.name ?? "-"}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
