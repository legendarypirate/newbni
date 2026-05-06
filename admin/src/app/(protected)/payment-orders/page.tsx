import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";

export const metadata = { title: "QPay төлбөрүүд | Админ" };

export default async function AdminPaymentOrdersPage() {
  const res = await serverAuthedFetch("/admin/payment-orders").catch(() => null);
  const data = (res ? await res.json().catch(() => ({})) : {}) as {
    rows?: Array<{
      id: string;
      orderRef: string;
      targetType: string;
      targetId: string;
      amountMnt: number;
      status: string;
      createdAt: string;
    }>;
  };
  const rows: {
    id: string;
    orderRef: string;
    targetType: string;
    targetId: string;
    amountMnt: number;
    status: string;
    createdAt: string;
  }[] = Array.isArray(data.rows) ? data.rows : [];

  return (
    <div>
      <h1 className="h4 fw-bold mb-3">QPay төлбөрүүд</h1>
      {!res || !res.ok ? <div className="alert alert-danger">Backend API unavailable.</div> : null}
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Order ref</th>
              <th>Зорилго</th>
              <th>Дүн (₮)</th>
              <th>Төлөв</th>
              <th>Үүсгэсэн</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)}>
                <td>{String(r.id)}</td>
                <td className="small text-break">{r.orderRef}</td>
                <td className="small">
                  {r.targetType} #{String(r.targetId)}
                </td>
                <td>{r.amountMnt.toLocaleString()}</td>
                <td>{r.status}</td>
                <td className="small">{String(r.createdAt).slice(0, 19)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <p className="text-muted small">Мөр байхгүй.</p> : null}
    </div>
  );
}
