"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";

function navClass(pathname: string, href: string, exact?: boolean): string {
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return `pl-nav-item${active ? " active" : ""}`;
}

export default function DashboardSidebarNav() {
  const pathname = usePathname() ?? "";
  const t = useT();

  return (
    <nav className="pl-nav flex-grow-1">
      <div className="pl-nav-label">{t("dashboard.navMain")}</div>
      <Link href="/dashboard" className={navClass(pathname, "/dashboard", true)}>
        <i className="fa-solid fa-chart-pie" aria-hidden="true" />
        <span>{t("dashboard.overview")}</span>
      </Link>
      <Link href="/dashboard/trips" className={navClass(pathname, "/dashboard/trips")}>
        <i className="fa-solid fa-paper-plane" aria-hidden="true" />
        <span>{t("dashboard.trips")}</span>
      </Link>
      <Link href="/dashboard/events" className={navClass(pathname, "/dashboard/events")}>
        <i className="fa-solid fa-calendar-days" aria-hidden="true" />
        <span>{t("dashboard.events")}</span>
      </Link>
      <Link href="/dashboard/weekly-meetings" className={navClass(pathname, "/dashboard/weekly-meetings")}>
        <i className="fa-solid fa-users-line" aria-hidden="true" />
        <span>{t("dashboard.weeklyMeetings")}</span>
      </Link>
      <Link href="/dashboard/registrations" className={navClass(pathname, "/dashboard/registrations")}>
        <i className="fa-solid fa-user-check" aria-hidden="true" />
        <span>{t("dashboard.registrations")}</span>
      </Link>

      <div className="pl-nav-label">{t("dashboard.navFinance")}</div>
      <Link href="/dashboard/payments" className={navClass(pathname, "/dashboard/payments")}>
        <i className="fa-solid fa-credit-card" aria-hidden="true" />
        <span>{t("dashboard.payments")}</span>
      </Link>

      <div className="pl-nav-label">{t("dashboard.navSettings")}</div>
      <Link href="/dashboard/profile" className={navClass(pathname, "/dashboard/profile")}>
        <i className="fa-solid fa-building" aria-hidden="true" />
        <span>{t("dashboard.orgProfile")}</span>
      </Link>
      <Link href="/dashboard/settings" className={navClass(pathname, "/dashboard/settings")}>
        <i className="fa-solid fa-gear" aria-hidden="true" />
        <span>{t("dashboard.settings")}</span>
      </Link>
    </nav>
  );
}
