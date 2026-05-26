"use client";

import { useCallback, useEffect, useState } from "react";
import PlatformAuthGate from "@/components/platform/PlatformAuthGate";
import PlatformSidebar from "@/components/platform/PlatformSidebar";

const STORAGE_KEY = "busy_platform_sidebar_collapsed";

type Props = {
  children: React.ReactNode;
};

export default function PlatformShell({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <div
      className={`pl-wrapper${collapsed ? " pl-sidebar-collapsed" : ""}${ready ? " pl-sidebar-ready" : ""}`}
    >
      <PlatformSidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <main className="pl-content">
        <PlatformAuthGate>{children}</PlatformAuthGate>
      </main>
    </div>
  );
}
