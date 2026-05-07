"use client";

import { useEffect, useState } from "react";
import MediaHeroShell from "@/components/platform/panels/MediaHeroShell";
import { mediaUrl } from "@/lib/media-url";
import { apiFetch } from "@/lib/api-client";
import { usePlatformSession } from "@/components/platform/PlatformSessionContext";

function heroSlidesFromBiz(json: unknown): string[] {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return [];
  }
  const raw = (json as Record<string, unknown>).hero_slides;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((u): u is string => typeof u === "string").map((u) => mediaUrl(u));
}

export default function MediaPanel() {
  const session = usePlatformSession();
  const [slides, setSlides] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/profiles/${encodeURIComponent(session.id)}`);
        if (!res.ok) {
          if (!cancelled) setSlides([]);
          return;
        }
        const json = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: { businessJson?: unknown } }
          | null;
        if (!cancelled) {
          setSlides(heroSlidesFromBiz(json?.data?.businessJson ?? null));
        }
      } catch {
        if (!cancelled) setSlides([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session.id]);

  if (slides === null) {
    return (
      <div className="text-muted small py-5 text-center" aria-busy="true">
        Уншиж байна…
      </div>
    );
  }

  return <MediaHeroShell slides={slides} />;
}
