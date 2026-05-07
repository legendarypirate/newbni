import Link from "next/link";
import type { Metadata } from "next";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import TripsDashboardTable from "@/components/dashboard/TripsDashboardTable";
import { Button } from "@/components/ui/button";
import { serverAuthedFetch } from "@/lib/server-authed-fetch";

export const metadata: Metadata = {
  title: "Аялалууд | Удирдлагын самбар",
};

export const dynamic = "force-dynamic";

export default async function DashboardTripsPage() {
  // Auth is enforced by `DashboardAuthGate` in the layout. Trip ownership is
  // resolved client-side once the data lands; we no longer need the server
  // session just to compute `currentUserId` for highlighting.
  const res = await serverAuthedFetch("/platform/trips").then(r => r.json()).catch(() => ({ ok: false }));
  const trips = res.ok ? res.data?.trips ?? res.trips ?? [] : [];

  const tripRows = (trips || []).map((t: any) => ({
    id: t.id,
    destination: t.destination,
    startDate: t.startDate,
    endDate: t.endDate,
    statusLabel: t.statusLabel,
    coverImageUrl: t.coverImageUrl,
    managerAccountId: t.managerAccountId != null ? Number(t.managerAccountId) : null,
  }));

  return (
    <DashboardPage>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Аялалууд</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Нийтийн каталог болон таны хариуцсан аяллууд. Дэлгэрэнгүй, бүртгэл нь ирээдүйн модульд холбогдоно.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/trips">Нийтийн жагсаалт</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/platform/trips">Платформ — аялал</Link>
          </Button>
        </div>
      </div>

      <TripsDashboardTable trips={tripRows} currentUserId={null} />
    </DashboardPage>
  );
}
