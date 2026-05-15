"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";

export default function DashboardTopBar() {
  const t = useT();

  return (
    <header className="pl-dash-topbar d-flex align-items-center gap-3 flex-wrap">
      <button type="button" className="btn btn-light d-md-none border" id="dashSidebarOpen" aria-label={t("common.openMenu")}>
        <i className="fa-solid fa-bars" aria-hidden="true" />
      </button>
      <h1 className="h6 fw-bold mb-0 text-truncate">{t("dashboard.title")}</h1>

      <div className="ms-auto d-flex align-items-center gap-2">
        <div className="dropdown">
          <button
            className="btn btn-light rounded-circle position-relative p-2"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            style={{ width: 40, height: 40 }}
          >
            <i className="fa-regular fa-bell" aria-hidden="true" />
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
              <span className="visually-hidden">{t("dashboard.newNotification")}</span>
            </span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2" style={{ width: 300 }}>
            <li>
              <h6 className="dropdown-header">{t("dashboard.notifications")}</h6>
            </li>
            <li>
              <span className="dropdown-item py-2 text-muted small">{t("dashboard.notificationsEmpty")}</span>
            </li>
          </ul>
        </div>

        <div className="dropdown">
          <button
            className="btn p-0 d-flex align-items-center gap-2 border-0 bg-transparent"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://ui-avatars.com/api/?name=Admin&background=2563eb&color=fff"
              alt=""
              className="rounded-circle"
              width={36}
              height={36}
            />
            <div className="text-start d-none d-sm-block">
              <div className="fw-semibold lh-1 text-dark" style={{ fontSize: "0.85rem" }}>
                Admin
              </div>
              <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                admin@busy.mn
              </div>
            </div>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2">
            <li>
              <Link className="dropdown-item py-2" href="/dashboard/profile">
                <i className="fa-regular fa-user me-2 opacity-50" aria-hidden="true" /> {t("dashboard.profile")}
              </Link>
            </li>
            <li>
              <Link className="dropdown-item py-2" href="/dashboard/settings">
                <i className="fa-solid fa-gear me-2 opacity-50" aria-hidden="true" /> {t("dashboard.settings")}
              </Link>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <Link className="dropdown-item py-2 text-danger" href="/auth/logout">
                <i className="fa-solid fa-arrow-right-from-bracket me-2 opacity-50" aria-hidden="true" /> {t("auth.logout")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
