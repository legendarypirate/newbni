"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAuthToken, removeAuthToken } from "@/lib/api-client";
import { publicApiBase } from "@/lib/client-api-base";
import { useT } from "@/lib/i18n/client";

type NavUser = {
  displayName: string;
  role: string | null;
};

function readDisplayNameFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((row) => row.startsWith("bni_platform_nav_display="))
    ?.split("=")[1];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw).trim() || null;
  } catch {
    return raw.trim() || null;
  }
}

function nameFromJwt(token: string): string | null {
  try {
    const seg = token.split(".")[1];
    if (!seg) return null;
    const payload = JSON.parse(atob(seg.replace(/-/g, "+").replace(/_/g, "/"))) as {
      displayName?: string;
      email?: string;
      role?: string;
    };
    const name = String(payload.displayName || payload.email || "").trim();
    return name || null;
  } catch {
    return null;
  }
}

function roleFromJwt(token: string): string | null {
  try {
    const seg = token.split(".")[1];
    if (!seg) return null;
    const payload = JSON.parse(atob(seg.replace(/-/g, "+").replace(/_/g, "/"))) as { role?: string };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

type Props = {
  /** Called when session check finishes: true = show user menu, false = show login/register. */
  onResolved?: (loggedIn: boolean) => void;
};

/** Single user icon → dropdown (greeting, Platform/Admin, logout). React-controlled, no Bootstrap JS. */
export function NavbarUserMenu({ onResolved }: Props) {
  const t = useT();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);

  const loadSession = useCallback(async () => {
    const token = getAuthToken() || "";
    if (!token) {
      setUser(null);
      setReady(true);
      return;
    }

    const fallback: NavUser = {
      displayName: readDisplayNameFromCookie() || nameFromJwt(token) || "User",
      role: roleFromJwt(token),
    };

    try {
      const res = await fetch(`${publicApiBase()}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        user?: { displayName?: string; email?: string; role?: string };
      } | null;
      if (res.ok && data?.ok && data.user) {
        setUser({
          displayName: String(data.user.displayName || data.user.email || fallback.displayName).trim(),
          role: data.user.role ? String(data.user.role) : null,
        });
      } else {
        setUser(fallback);
      }
    } catch {
      setUser(fallback);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!ready) return;
    onResolved?.(user != null);
  }, [ready, user, onResolved]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!ready || !user) {
    return null;
  }

  const adminUrl = `${(process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002").replace(/\/$/, "")}/admin`;
  const isAdmin = user.role === "admin";

  return (
    <div className="navbar-user-menu position-relative" ref={rootRef}>
      <button
        type="button"
        className="btn btn-light btn-sm rounded-circle border d-flex align-items-center justify-content-center navbar-user-menu__toggle"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("nav.accountMenu")}
        onClick={() => setOpen((v) => !v)}
      >
        <i className="fa-solid fa-user" aria-hidden />
      </button>

      {open ? (
        <ul
          className="dropdown-menu show dropdown-menu-end shadow border-0 py-2 navbar-user-menu__panel"
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 0.35rem)",
            minWidth: "14rem",
            borderRadius: 12,
            zIndex: 1100,
          }}
        >
          <li className="px-3 py-2 border-bottom border-light" role="none">
            <span className="small fw-semibold text-dark d-block text-truncate" role="menuitem">
              {t("auth.greeting")}, {user.displayName}
            </span>
          </li>
          <li role="none">
            {isAdmin ? (
              <a className="dropdown-item py-2" href={adminUrl} role="menuitem" onClick={() => setOpen(false)}>
                <i className="fa-solid fa-shield-halved me-2 text-muted" aria-hidden />
                {t("auth.admin")}
              </a>
            ) : (
              <Link
                className="dropdown-item py-2"
                href="/platform"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <i className="fa-solid fa-gauge-high me-2 text-muted" aria-hidden />
                {t("auth.platform")}
              </Link>
            )}
          </li>
          <li role="none">
            <a
              className="dropdown-item py-2 text-danger"
              href="/auth/logout"
              role="menuitem"
              onClick={() => {
                removeAuthToken();
                setOpen(false);
              }}
            >
              <i className="fa-solid fa-right-from-bracket me-2" aria-hidden />
              {t("auth.logout")}
            </a>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
