import DbTranslationsPanel from "@admin/components/admin/DbTranslationsPanel";

export const metadata = { title: "DB орчуулга | Админ" };

export default function AdminDbTranslationsPage() {
  return (
    <div>
      <h1 className="h4 fw-bold mb-3">DB орчуулга (AI)</h1>
      <DbTranslationsPanel />
    </div>
  );
}
