"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  displayName: string;
  photoUrl: string | null;
};

/** Platform header: user tools only (main nav lives in the left sidebar). */
export default function PlatformTopNav({ displayName, photoUrl }: Props) {
  const avatarSrc =
    photoUrl && photoUrl.startsWith("http")
      ? photoUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || "U")}&background=2563eb&color=fff&size=64`;

  return (
    <header className="pl-top-nav pl-top-nav--user-only">
      <div className="ms-auto d-flex align-items-center gap-3">
        <button type="button" className="btn btn-link text-muted p-1" title="Хайх">
          <i className="fa-solid fa-magnifying-glass" />
        </button>
        <div className="position-relative">
          <button type="button" className="btn btn-link text-muted p-1" title="Мэдэгдэл">
            <i className="fa-regular fa-bell" />
          </button>
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: "0.5rem", padding: "3px 5px" }}
          >
            2
          </span>
        </div>
        <button type="button" className="btn btn-link text-muted p-1" title="Зурвас">
          <i className="fa-regular fa-comment-dots" />
        </button>
        <div className="d-flex align-items-center gap-2 border-start ps-3">
          <div className="text-end d-none d-xl-block">
            <div style={{ fontSize: "0.8rem", fontWeight: 700, lineHeight: 1.2 }}>{displayName}</div>
            <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>Зохион байгуулагч</div>
          </div>
          <Image
            src={avatarSrc}
            alt=""
            width={32}
            height={32}
            className="rounded-circle"
            style={{ objectFit: "cover" }}
            unoptimized={avatarSrc.includes("ui-avatars.com")}
          />
          <Link href="/auth/logout" className="btn btn-sm btn-outline-secondary ms-1">
            Гарах
          </Link>
        </div>
      </div>
    </header>
  );
}
