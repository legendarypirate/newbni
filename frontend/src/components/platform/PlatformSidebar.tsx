"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BUSY_MISSION_LINES } from "@/lib/busy-platform-vision";
import { PLATFORM_SIDEBAR_NAV } from "./platform-nav";

function isActive(pathname: string, itemKey: string, href: string): boolean {
  if (itemKey === "dashboard") {
    return pathname === "/platform" || pathname === "/platform/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function PlatformSidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname() ?? "";

  let lastGroup: string | null = null;

  return (
    <aside className="pl-sidebar" aria-label="Платформын цэс">
      <div className="pl-sidebar-head">
        <Link
          href="/platform"
          prefetch={false}
          className="pl-logo text-decoration-none"
          title="BUSY.mn"
        >
          <span className="pl-logo-mark" aria-hidden="true">
            B
          </span>
          <span className="pl-logo-text">
            <span className="pl-logo-busy">USY</span>
            <span className="pl-logo-dot">.mn</span>
          </span>
        </Link>
        <button
          type="button"
          className="pl-sidebar-toggle"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Цэсийг өргөтгөх" : "Цэсийг хураах"}
          title={collapsed ? "Цэсийг өргөтгөх" : "Цэсийг хураах"}
        >
          <i className={`fa-solid ${collapsed ? "fa-angles-right" : "fa-angles-left"}`} aria-hidden="true" />
        </button>
      </div>

      <nav className="pl-nav">
        {PLATFORM_SIDEBAR_NAV.map((item) => {
          const showLabel = item.group !== lastGroup;
          lastGroup = item.group;
          const active = isActive(pathname, item.key, item.href);
          return (
            <div key={item.key}>
              {showLabel ? (
                <div className="pl-nav-label" title={item.group}>
                  {item.group}
                </div>
              ) : null}
              <Link
                href={item.href}
                prefetch={false}
                className={`pl-nav-item${active ? " active" : ""}`}
                title={item.label}
              >
                <i className={item.iconClass} aria-hidden="true" />
                <span className="pl-nav-item-label">{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="pl-sidebar-footer mt-auto pt-4">
        <div className="pl-sidebar-mission px-2 mb-3" aria-label="BUSY.mn үндсэн санаа">
          {BUSY_MISSION_LINES.map((line) => (
            <span key={line} className="d-block">
              {line}
            </span>
          ))}
        </div>
        <div className="pl-help-box">
          <div className="pl-help-title">Тусламж хэрэгтэй юу?</div>
          <a href="mailto:support@busy.mn" className="pl-btn-support text-center text-decoration-none d-block">
            Холбоо барих
          </a>
        </div>
      </div>
    </aside>
  );
}
