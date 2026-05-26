"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { removeAuthToken } from "@/lib/api-client";
import { useT } from "@/lib/i18n/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  SHOW_PUBLIC_HEADER_LOGIN_REGISTER,
  SHOW_PUBLIC_NAV_BUSY_AI,
  SHOW_PUBLIC_NAV_COMPANIES,
  SHOW_PUBLIC_NAV_INVESTMENTS,
  SHOW_PUBLIC_NAV_MEMBERS,
  SHOW_PUBLIC_NAV_OPPORTUNITIES,
} from "@/lib/public-marketing-flags";

/** Marketing top bar with i18n nav labels. */
export default function NavbarI18n() {
  const pathname = usePathname() ?? "/";
  const t = useT();
  const [session, setSession] = useState<{ displayName: string; role: string | null } | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const display = document.cookie
      .split("; ")
      .find((row) => row.startsWith("bni_platform_nav_display="))
      ?.split("=")[1];
    const token = localStorage.getItem("bni_token");
    if (!token) {
      setSession(null);
      setSessionReady(true);
      return;
    }
    try {
      const payloadSeg = token.split(".")[1];
      const payload = JSON.parse(atob(payloadSeg.replace(/-/g, "+").replace(/_/g, "/")));
      setSession({
        displayName: display ? decodeURIComponent(display) : payload.displayName || payload.email || "User",
        role: typeof payload.role === "string" ? payload.role : null,
      });
    } catch {
      setSession({
        displayName: display ? decodeURIComponent(display) : "User",
        role: null,
      });
    } finally {
      setSessionReady(true);
    }
  }, []);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 992px)");
    const onMq = () => {
      if (mq.matches) setMobileNavOpen(false);
    };
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light navbar-custom">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/finallogo.png" alt="BUSY.mn" style={{ height: 32, width: "auto" }} />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarNav"
          aria-expanded={mobileNavOpen}
          aria-label="Menu"
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div
          id="navbarNav"
          className={`navbar-collapse flex-column flex-lg-row flex-grow-1 align-items-stretch align-items-lg-center w-100 mt-2 mt-lg-0 ${
            mobileNavOpen ? "d-flex" : "d-none"
          } d-lg-flex`}
        >
          <ul className="navbar-nav mx-auto align-items-lg-center">
            <li className="nav-item">
              <Link className={`nav-link${pathname.startsWith("/trips") ? " active" : ""}`} href="/trips">
                {t("nav.trips")}
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link${pathname.startsWith("/events") ? " active" : ""}`} href="/events">
                {t("nav.events")}
              </Link>
            </li>
            {SHOW_PUBLIC_NAV_OPPORTUNITIES ? (
              <li className="nav-item">
                <Link
                  className={`nav-link${pathname.startsWith("/opportunities") ? " active" : ""}`}
                  href="/opportunities"
                >
                  {t("nav.opportunities")}
                </Link>
              </li>
            ) : null}
            {SHOW_PUBLIC_NAV_COMPANIES ? (
              <li className="nav-item">
                <Link className={`nav-link${pathname.startsWith("/companies") ? " active" : ""}`} href="/companies">
                  {t("nav.companies")}
                </Link>
              </li>
            ) : null}
            {SHOW_PUBLIC_NAV_INVESTMENTS ? (
              <li className="nav-item">
                <Link className={`nav-link${pathname.startsWith("/investments") ? " active" : ""}`} href="/investments">
                  {t("nav.investments")}
                </Link>
              </li>
            ) : null}
            {SHOW_PUBLIC_NAV_MEMBERS ? (
              <li className="nav-item">
                <Link
                  className={`nav-link${pathname.startsWith("/members") || pathname.startsWith("/company") ? " active" : ""}`}
                  href="/members"
                >
                  {t("nav.members")}
                </Link>
              </li>
            ) : null}
            <li className="nav-item">
              <Link className={`nav-link${pathname.startsWith("/news") ? " active" : ""}`} href="/news">
                {t("nav.news")}
              </Link>
            </li>
            {SHOW_PUBLIC_NAV_BUSY_AI ? (
              <li className="nav-item">
                <Link className={`nav-link${pathname.startsWith("/busy-ai") ? " active" : ""}`} href="/busy-ai">
                  {t("nav.busyAi")}
                </Link>
              </li>
            ) : null}
          </ul>
          <div className="d-flex align-items-center gap-2 ms-lg-auto flex-wrap mt-3 mt-lg-0">
            <LanguageSwitcher />
            {SHOW_PUBLIC_HEADER_LOGIN_REGISTER ? (
              <>
                {sessionReady && session ? (
                  <div className="dropdown">
                    <button
                      className="btn btn-light btn-sm rounded-circle border d-flex align-items-center justify-content-center"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      aria-label={t("nav.accountMenu")}
                      style={{ width: 36, height: 36 }}
                    >
                      <i className="fa-solid fa-user" aria-hidden />
                    </button>
                    <ul
                      className="dropdown-menu dropdown-menu-end shadow border-0 py-2"
                      style={{ borderRadius: 12, minWidth: "14rem" }}
                    >
                      <li className="px-3 pb-2 border-bottom border-light">
                        <div className="small text-muted">{t("auth.greeting")}</div>
                        <div className="fw-semibold text-truncate">{session.displayName}</div>
                      </li>
                      <li>
                        {session.role === "admin" ? (
                          <a
                            className="dropdown-item py-2"
                            href={`${(process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002").replace(/\/$/, "")}/admin`}
                          >
                            <i className="fa-solid fa-shield-halved me-2 text-muted" aria-hidden />
                            {t("auth.admin")}
                          </a>
                        ) : (
                          <Link className="dropdown-item py-2" href="/platform">
                            <i className="fa-solid fa-gauge-high me-2 text-muted" aria-hidden />
                            {t("nav.myDashboard")}
                          </Link>
                        )}
                      </li>
                      <li>
                        <a
                          className="dropdown-item py-2 text-danger"
                          href="/auth/logout"
                          onClick={() => removeAuthToken()}
                        >
                          <i className="fa-solid fa-right-from-bracket me-2" aria-hidden />
                          {t("auth.logout")}
                        </a>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <>
                    <Link href="/auth/login" className="btn btn-light px-4 fw-medium rounded-pill border">
                      {t("auth.login")}
                    </Link>
                    <Link href="/auth/register" className="btn btn-brand px-4 fw-medium rounded-pill">
                      {t("auth.register")}
                    </Link>
                  </>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
