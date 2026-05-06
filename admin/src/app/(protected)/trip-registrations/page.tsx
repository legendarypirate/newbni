import Link from "next/link";

export const metadata = { title: "Аяллын формын бүртгэл | Админ" };

export default async function AdminTripRegistrationsPage() {
  return (
    <div>
      <h1 className="h4 fw-bold mb-2">Аяллын формын бүртгэл</h1>
      <div className="alert alert-info">API-only migration in progress. Use trip-level response pages from Trips list.</div>
      <Link href="/admin/trips" className="btn btn-sm btn-outline-primary">Аяллын жагсаалт</Link>
    </div>
  );
}
