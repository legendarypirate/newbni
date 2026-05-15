"use client";

import { useState } from "react";

export default function MemberFollowButton({ accountId }: { accountId: number }) {
  const storageKey = `busy-followed-member:${accountId}`;
  const [followed, setFollowed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(storageKey) === "1";
  });

  function toggleFollow() {
    const next = !followed;
    setFollowed(next);
    if (next) {
      window.localStorage.setItem(storageKey, "1");
    } else {
      window.localStorage.removeItem(storageKey);
    }
  }

  return (
    <button
      type="button"
      className="btn-brand-outline-secondary"
      onClick={toggleFollow}
      aria-pressed={followed}
      title={followed ? "Дагахаа болих" : "Дагах"}
    >
      <i className={followed ? "fa-solid fa-star" : "fa-regular fa-star"} /> {followed ? "Дагасан" : "Дагах"}
    </button>
  );
}
