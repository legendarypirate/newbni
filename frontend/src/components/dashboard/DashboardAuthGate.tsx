"use client";

import { useEffect, useState } from "react";
import { publicApiBase } from "@/lib/client-api-base";

/**
 * Same JWT/localStorage auth check as `PlatformAuthGate`, but without the
 * `/platform` top-nav chrome. Use to wrap any subtree (e.g. `/dashboard/*`)
 * where we need the user to be logged in but the page provides its own UI.
 *
 * Renders a tiny inline loader while the JWT is verified.
 */
export default function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "ok" | "redirecting">("checking");

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
        const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
        if (!data?.ok) {
          if (!cancelled) bounce();
          return;
        }
        if (!cancelled) setState("ok");
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
      const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
      setState("redirecting");
      window.location.replace(`/auth/login?next=${encodeURIComponent(safeNext)}`);
    }

    check();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "ok") {
    return <>{children}</>;
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
