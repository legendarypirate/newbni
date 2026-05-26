import Link from "next/link";
import PlatformBodyClass from "@/components/platform/PlatformBodyClass";
import DashboardAuthGate from "@/components/dashboard/DashboardAuthGate";
import { I18nProvider } from "@/lib/i18n/client";
import { createServerT, getServerLang } from "@/lib/i18n/server";
import DashboardSidebarNav from "./DashboardSidebarNav";
import DashboardSidebarToggle from "./DashboardSidebarToggle";
import DashboardTopBar from "./DashboardTopBar";
import "@/styles/dashboard-shell.css";

/**
 * Auth is enforced *client-side* by `DashboardAuthGate` (JWT from
 * `localStorage` → `/auth/me`). The server layout itself does no session
 * lookup so individual pages never need to redirect to login.
 */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const lang = await getServerLang();
  const t = createServerT(lang);

  return (
    <I18nProvider initialLang={lang}>
      <PlatformBodyClass />
      <div className="pl-wrapper dash-shell">
        <aside className="pl-sidebar pl-sidebar--drawer" id="dashSidebar">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
            <Link href="/" className="pl-logo text-decoration-none d-block mb-0 py-1">
              BUSY<span>.mn</span>
            </Link>
            <button
              type="button"
              className="btn btn-link d-md-none p-1 text-muted lh-1"
              id="dashSidebarClose"
              aria-label={t("common.close")}
            >
              <i className="fa-solid fa-xmark fa-lg" aria-hidden="true" />
            </button>
          </div>

          <DashboardSidebarNav />
        </aside>

        <main className="pl-content d-flex flex-column min-vh-100">
          <DashboardTopBar />

          <div className="flex-grow-1" style={{ background: "var(--pl-bg, #f8fafc)" }}>
            <DashboardAuthGate>{children}</DashboardAuthGate>
          </div>
        </main>

        <div className="pl-dash-overlay" id="dashSidebarOverlay" aria-hidden="true" />
      </div>
      <DashboardSidebarToggle />
    </I18nProvider>
  );
}
