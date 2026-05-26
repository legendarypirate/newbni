"use client";

import { useCallback, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { apiFetch, getAuthToken } from "@/lib/api-client";
import { useT } from "@/lib/i18n/client";

type Props = {
  targetType: "trip" | "event";
  targetId: string | number | bigint;
  initialCount?: number;
  initialLiked?: boolean;
  className?: string;
  size?: "sm" | "md";
  /** `overlay` = top-right on image; `inline` = sits in a button row with CTA links */
  layout?: "overlay" | "inline";
};

export function ContentLikeButton({
  targetType,
  targetId,
  initialCount = 0,
  initialLiked = false,
  className = "",
  size = "md",
  layout = "overlay",
}: Props) {
  const t = useT();
  const pathname = usePathname() ?? "/";
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const onClick = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (busy) return;

      if (!getAuthToken()) {
        window.location.href = `/auth/login?next=${encodeURIComponent(pathname)}`;
        return;
      }

      setBusy(true);
      try {
        const res = await apiFetch("/likes/toggle", {
          method: "POST",
          body: JSON.stringify({ targetType, targetId: String(targetId) }),
        });
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          data?: { liked?: boolean; likeCount?: number };
        } | null;
        if (res.ok && json?.ok && json.data) {
          setLiked(Boolean(json.data.liked));
          if (typeof json.data.likeCount === "number") {
            setCount(json.data.likeCount);
          }
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, pathname, targetId, targetType],
  );

  return (
    <button
      type="button"
      className={`content-like-btn content-like-btn--${size} content-like-btn--${layout}${liked ? " is-liked" : ""}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? t("common.unlike") : t("common.like")}
      disabled={busy}
    >
      <i className={liked ? "fa-solid fa-thumbs-up" : "fa-regular fa-thumbs-up"} aria-hidden />
      {count > 0 ? <span className="content-like-count">{count}</span> : null}
    </button>
  );
}
