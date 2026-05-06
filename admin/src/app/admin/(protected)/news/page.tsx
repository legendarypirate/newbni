import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";

export const metadata = { title: "Мэдээ | Админ" };

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminNewsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const status = sp.status === "draft" ? "draft" : undefined;
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await serverAuthedFetch(`/admin/news${qs}`).catch(() => null);
  const data = (res ? await res.json().catch(() => ({})) : {}) as {
    rows?: Array<{ id: number; title: string; slug: string; status: string; createdAt: string }>;
  };
  const rows = Array.isArray(data.rows) ? data.rows : [];

  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Мэдээ</h1>
      {!res || !res.ok ? <div className="alert alert-danger">Backend API unavailable.</div> : null}
      <p className="text-muted small mb-3">
        <code>news</code> — жагсаалт. Summernote редакторыг дараа нь оруулна.
        {status === "draft" ? (
          <span className="ms-1 fw-semibold">(зөвхөн ноорог)</span>
        ) : null}
      </p>
      <div className="table-responsive">
        <table className="table table-hover table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Гарчиг</th>
              <th>Slug</th>
              <th>Төлөв</th>
              <th>Үүсгэсэн</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.title}</td>
                <td className="small text-break">{r.slug}</td>
                <td>{r.status}</td>
                <td className="small">{String(r.createdAt).slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
