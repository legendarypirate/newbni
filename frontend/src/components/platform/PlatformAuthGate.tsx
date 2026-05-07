"use client";

import { useEffect, useState } from "react";
import { publicApiBase } from "@/lib/client-api-base";
import PlatformTopNav from "./PlatformTopNav";

/**
 * Client-side JWT auth gate for `/platform/*` pages.
 *
 * Reads `bni_token` from `localStorage`, calls the backend's `/auth/me`
 * with `Authorization: Bearer ${token}`, and:
 *   - if missing or invalid: redirects to `/auth/login?next=<currentPath>`
 *   - if valid: renders the top-nav (with the user's name/avatar) followed
 *     by the route's children
 *
 * Renders a tiny inline loader during the check so we never flash the page
 * to a logged-out visitor.
 *
 * Why client-side: with a stateless JWT in `localStorage` there is no
 * httpOnly cookie to inspect server-side, and we explicitly do not want to
 * rely on the JS-set cookie either (SameSite / Secure / cross-subdomain
 * pitfalls). The browser is the source of truth.
 */
type GateUser = {
  displayName: string;
  photoUrl: string | null;
};

export default function PlatformAuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "ok" | "redirecting">("checking");
  const [user, setUser] = useState<GateUser>({ displayName: "", photoUrl: null });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const token =
        (typeof window !== "undefined" && window.localStorage.getItem("bni_token")) || "";

      if (!token) {
        if (!cancelled) bounce();
        return;
      }

      try {
        const res = await fetch(`${publicApiBase()}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) bounce();
          return;
        }
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; user?: { displayName?: string; photoUrl?: string | null } }
          | null;
        if (!data?.ok || !data?.user) {
          if (!cancelled) bounce();
          return;
        }
        if (!cancelled) {
          setUser({
            displayName: String(data.user.displayName ?? ""),
            photoUrl: data.user.photoUrl ?? null,
          });
          setState("ok");
        }
      } catch {
        if (!cancelled) bounce();
      }
    }

    function bounce() {
      try {
        window.localStorage.removeItem("bni_token");
      } catch {
        /* ignore */
      }
      const next = window.location.pathname + window.location.search;
      const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/platform";
      setState("redirecting");
      window.location.replace(`/auth/login?next=${encodeURIComponent(safeNext)}`);
    }

    check();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "ok") {
    return (
      <>
        <PlatformTopNav displayName={user.displayName} photoUrl={user.photoUrl} />
        <div className="pl-panel-container">{children}</div>
      </>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        color: "var(--text-muted, #6b7280)",
        fontSize: "0.9rem",
      }}
      aria-busy="true"
    >
      <span>Уншиж байна…</span>
    </div>
  );
}
