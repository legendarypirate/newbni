"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { BniLangCode } from "@/lib/nav-php-parity";
import { isBniLang } from "@/lib/nav-php-parity";
import { useT } from "@/lib/i18n/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NavbarUserMenu } from "@/components/NavbarUserMenu";
import {
  SHOW_PUBLIC_HEADER_LOGIN_REGISTER,
  SHOW_PUBLIC_NAV_BUSY_AI,
  SHOW_PUBLIC_NAV_COMPANIES,
  SHOW_PUBLIC_NAV_INVESTMENTS,
  SHOW_PUBLIC_NAV_MEMBERS,
  SHOW_PUBLIC_NAV_OPPORTUNITIES,
} from "@/lib/public-marketing-flags";

/** Matches `includes/header.php` `<nav>` children (paths adapted for Next App Router). */
const NAV = [
  { href: "/trips", labelKey: "nav.trips" as const, id: "trips" },
  { href: "/events", labelKey: "nav.events" as const, id: "events" },
  { href: "/opportunities", labelKey: "nav.opportunities" as const, id: "opportunities" },
  { href: "/companies", labelKey: "nav.companies" as const, id: "companies" },
  { href: "/investments", labelKey: "nav.investments" as const, id: "investments" },
  { href: "/members", labelKey: "nav.members" as const, id: "members" },
  { href: "/news", labelKey: "nav.news" as const, id: "news" },
  { href: "/busy-ai", labelKey: "nav.busyAi" as const, id: "busy_ai" },
] as const;

function isNavItemVisible(pageId: (typeof NAV)[number]["id"]): boolean {
  if (pageId === "companies") return SHOW_PUBLIC_NAV_COMPANIES;
  if (pageId === "investments") return SHOW_PUBLIC_NAV_INVESTMENTS;
  if (pageId === "members") return SHOW_PUBLIC_NAV_MEMBERS;
  if (pageId === "busy_ai") return SHOW_PUBLIC_NAV_BUSY_AI;
  if (pageId === "opportunities") return SHOW_PUBLIC_NAV_OPPORTUNITIES;
  return true;
}

function navActive(pathname: string, href: string, pageId: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  if (pageId === "events" && pathname.startsWith("/events")) {
    return true;
  }
  if (pageId === "opportunities" && pathname.startsWith("/opportunities")) {
    return true;
  }
  if (pageId === "trips" && pathname.startsWith("/trips")) {
    return true;
  }
  if (pageId === "news" && pathname.startsWith("/news")) {
    return true;
  }
  if (pageId === "busy_ai" && pathname.startsWith("/busy-ai")) {
    return true;
  }
  if (pageId === "contact" && pathname.startsWith("/contact")) {
    return true;
  }
  if (pageId === "members" && (pathname.startsWith("/members") || pathname.startsWith("/company"))) {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type SiteHeaderNavProps = {
  initialLang: string;
  legacySiteUrl?: string;
  /**
   * When true (default if no legacy URL), login/register/dashboard/logout use Next routes.
   * When legacy is on the **same hostname** as `NEXT_PUBLIC_APP_URL`, this must be true so
   * Google/email set Next platform cookies; PHP `auth/login.php` only sets `PHPSESSID`.
   */
  headerAuthUseNext?: boolean;
  /** Optional cookie-backed preview until Next auth — same menus as PHP logged-in navbar */
  platformUser?: { displayName: string } | null;
};

export function SiteHeaderNav({
  initialLang,
  legacySiteUrl,
  headerAuthUseNext = true,
  platformUser,
}: SiteHeaderNavProps) {
  const pathname = usePathname() ?? "/";
  const navLang: BniLangCode = isBniLang(initialLang) ? initialLang : "mn";
  const t = useT();

  const [loggedIn, setLoggedIn] = useState<boolean | null>(platformUser ? true : null);
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

  const loginHref =
    headerAuthUseNext || !legacySiteUrl ? "/auth/login" : `${legacySiteUrl}/auth/login.php`;
  const registerHref =
    headerAuthUseNext || !legacySiteUrl ? "/auth/register" : `${legacySiteUrl}/auth/register.php`;

  return (
    <nav className="navbar navbar-expand-lg navbar-light navbar-custom">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/finallogo.png" alt="BUSY.mn" className="h-auto" style={{ height: 32, width: "auto" }} />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarNavSite"
          aria-expanded={mobileNavOpen}
          aria-label="Цэс нээх, хаах"
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div
          id="navbarNavSite"
          className={`navbar-collapse flex-column flex-lg-row flex-grow-1 align-items-stretch align-items-lg-center w-100 mt-2 mt-lg-0 ${
            mobileNavOpen ? "d-flex" : "d-none"
          } d-lg-flex`}
        >
          <ul className="navbar-nav mx-auto align-items-lg-center">
            {NAV.filter((item) => isNavItemVisible(item.id)).map((item) => (
              <li className="nav-item" key={item.href}>
                <Link
                  className={`nav-link${navActive(pathname, item.href, item.id) ? " active" : ""}`}
                  href={item.href}
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="d-flex align-items-center gap-2 ms-lg-auto flex-wrap mt-3 mt-lg-0">
            <LanguageSwitcher legacySiteUrl={legacySiteUrl} headerAuthUseNext={headerAuthUseNext} />
            {SHOW_PUBLIC_HEADER_LOGIN_REGISTER ? (
              <>
                <NavbarUserMenu onResolved={setLoggedIn} />
                {loggedIn === false ? (
                  <>
                    <Link href={loginHref} className="btn btn-light btn-sm px-3 fw-medium rounded-pill border">
                      {t("auth.login")}
                    </Link>
                    <Link href={registerHref} className="btn btn-brand btn-sm px-3 fw-medium rounded-pill">
                      {t("auth.register")}
                    </Link>
                  </>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
