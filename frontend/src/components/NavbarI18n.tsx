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
                  <>
                    <span className="small text-muted fw-semibold px-2">
                      {t("auth.greeting")}, {session.displayName}
                    </span>
                    {session.role === "admin" ? (
                      <a
                        href={`${(process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002").replace(/\/$/, "")}/admin`}
                        className="btn btn-light px-3 fw-medium rounded-pill border"
                      >
                        {t("auth.admin")}
                      </a>
                    ) : (
                      <Link href="/platform" className="btn btn-light px-3 fw-medium rounded-pill border">
                        {t("auth.platform")}
                      </Link>
                    )}
                    <a
                      href="/auth/logout"
                      onClick={() => removeAuthToken()}
                      className="btn btn-brand px-3 fw-medium rounded-pill"
                    >
                      {t("auth.logout")}
                    </a>
                  </>
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
