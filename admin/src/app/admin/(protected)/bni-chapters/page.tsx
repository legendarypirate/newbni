import Link from "next/link";

export const metadata = { title: "Бүлгүүд | Админ" };

export default async function AdminBniChaptersPage() {
  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Бүлгүүд</h1>
      <div className="alert alert-info">Энэ хуудасны CRUD нь API-only руу шилжиж байна.</div>
      <p className="small text-muted">
        Түр хугацаанд <Link href="/admin/bni-events">BNI events</Link> хуудсаар өгөгдлөө шалгана уу.
      </p>
    </div>
  );
}
