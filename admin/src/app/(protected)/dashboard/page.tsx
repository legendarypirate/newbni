import Link from "next/link";

export const metadata = { title: "Хяналтын самбар | Админ" };

export default async function AdminDashboardPage() {
  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Хяналтын самбар</h1>
      <div className="alert alert-info">
        Энэ хуудас API-only шинэчлэлт рүү шилжиж байна. Доорх цэснээс шаардлагатай жагсаалтуудыг нээнэ үү.
      </div>
      <div className="d-flex flex-wrap gap-2">
        <Link href="/admin/members" className="btn btn-sm btn-outline-primary">Гишүүд</Link>
        <Link href="/admin/news" className="btn btn-sm btn-outline-primary">Мэдээ</Link>
        <Link href="/admin/bni-events" className="btn btn-sm btn-outline-primary">BNI Events</Link>
      </div>
    </div>
  );
}
