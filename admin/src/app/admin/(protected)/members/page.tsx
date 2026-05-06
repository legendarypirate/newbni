import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";

export const metadata = { title: "Гишүүд | Админ" };

export default async function AdminMembersPage() {
  const res = await serverAuthedFetch("/admin/members").catch(() => null);
  const data = (res ? await res.json().catch(() => ({})) : {}) as {
    ok?: boolean;
    rows?: Array<{
      id: number;
      name: string;
      company?: string | null;
      industry?: string | null;
      email?: string | null;
      status?: string | null;
    }>;
  };
  const rows = Array.isArray(data.rows) ? data.rows : [];

  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Гишүүд</h1>
      {!res || !res.ok ? <div className="alert alert-danger">Backend API unavailable.</div> : null}
      <p className="text-muted small mb-3">
        <code>members</code> хүснэгт. CSV импорт, зураг оруулах зэрэг PHP функцийг дараагийн алхамтай нэмнэ.
      </p>
      <div className="table-responsive">
        <table className="table table-hover table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Нэр</th>
              <th>Байгууллага</th>
              <th>Чиглэл</th>
              <th>Имэйл</th>
              <th>Төлөв</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name}</td>
                <td>{r.company ?? "—"}</td>
                <td>{r.industry ?? "—"}</td>
                <td className="small">{r.email ?? "—"}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
