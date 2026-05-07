"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mediaUrl } from "@/lib/media-url";
import { usePlatformSession } from "@/components/platform/PlatformSessionContext";

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

type PremiumState = {
  isUnique: boolean;
  uniqueUntilStr: string;
  badgeUrl: string;
};

const EMPTY: PremiumState = { isUnique: false, uniqueUntilStr: "—", badgeUrl: "" };

function deriveState(businessJson: unknown): PremiumState {
  const biz =
    businessJson && typeof businessJson === "object" && !Array.isArray(businessJson)
      ? (businessJson as Record<string, unknown>)
      : {};
  const uniqueUntilRaw = str(biz.unique_profile_until);
  const uniqueTs = uniqueUntilRaw ? Date.parse(uniqueUntilRaw) : NaN;
  const isUnique = Number.isFinite(uniqueTs) && uniqueTs > Date.now();
  const uniqueUntilStr = Number.isFinite(uniqueTs) ? new Date(uniqueTs).toLocaleDateString("mn-MN") : "—";
  return { isUnique, uniqueUntilStr, badgeUrl: str(biz.unique_badge_url) };
}

type Props = {
  slot: "header" | "badge" | "invoice-date";
  /** For invoice-date slot, the localized "30 хоног" placeholder string. */
  fallback?: string;
};

/**
 * Three small slots that depend on the user's profile (unique status, badge, expiry).
 * Fetches `/profiles/:id` once and renders the requested slot. Keeps the parent
 * `PremiumPanel` a server component so the price env var stays server-side.
 */
export default function PremiumStatusBlock({ slot, fallback = "—" }: Props) {
  const session = usePlatformSession();
  const [state, setState] = useState<PremiumState | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/profiles/${encodeURIComponent(session.id)}`);
        if (!res.ok) {
          if (!cancelled) setState(EMPTY);
          return;
        }
        const json = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: { businessJson?: unknown } }
          | null;
        if (!cancelled) setState(deriveState(json?.data?.businessJson ?? null));
      } catch {
        if (!cancelled) setState(EMPTY);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session.id]);

  const s = state ?? EMPTY;

  if (slot === "header") {
    return (
      <div className="pps-status-widget">
        <div className="pps-status-icon">
          <i className="fa-solid fa-user-shield" />
        </div>
        <div className="pps-status-info">
          <span className="pps-status-label">Одоогийн түвшин</span>
          <span className="pps-status-value">{s.isUnique ? "ОНЦЛОХ ГИШҮҮН" : "ҮНЭГҮЙ ГИШҮҮН"}</span>
        </div>
        {!s.isUnique ? (
          <a href="#" className="pps-status-link">
            Түвшин ахиулах <i className="fa-solid fa-chevron-right small" />
          </a>
        ) : null}
      </div>
    );
  }

  if (slot === "badge") {
    if (s.badgeUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl(s.badgeUrl)} alt="" style={{ maxHeight: 40 }} />
      );
    }
    return (
      <div className="badge bg-warning text-dark px-2 py-1">
        <i className="fa-solid fa-crown me-1" /> ОНЦЛОХ КОМПАНИ
      </div>
    );
  }

  // invoice-date
  return <>{s.isUnique ? s.uniqueUntilStr : fallback}</>;
}
