import { serverAuthedFetch } from "@/lib/server-authed-fetch";

export type GrowthHint = {
  pctLabel: string;
  tone: "up" | "down" | "neutral";
  sublabel: string;
};

export type PlatformDashboardStats = {
  totalEvents: number;
  eventGrowth: GrowthHint;
  upcomingNext30d: number;
  totalRegistrations: number;
  registrationGrowth: GrowthHint;
  attendancePresent: number;
  attendanceTotal: number;
  attendancePct: number | null;
  revenueTotalMnt: number;
  revenueGrowth: GrowthHint;
  pendingApprovals: number;
};

export async function loadPlatformDashboardStats(): Promise<PlatformDashboardStats> {
  try {
    const res = await serverAuthedFetch("/admin/dashboard-stats");
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok || !json.data) {
      throw new Error("Failed to load dashboard stats");
    }
    return json.data;
  } catch (err) {
    console.error("loadPlatformDashboardStats failed:", err);
    return {
      totalEvents: 0,
      eventGrowth: { pctLabel: "0%", tone: "neutral", sublabel: "" },
      upcomingNext30d: 0,
      totalRegistrations: 0,
      registrationGrowth: { pctLabel: "0%", tone: "neutral", sublabel: "" },
      attendancePresent: 0,
      attendanceTotal: 0,
      attendancePct: null,
      revenueTotalMnt: 0,
      revenueGrowth: { pctLabel: "0%", tone: "neutral", sublabel: "" },
      pendingApprovals: 0,
    };
  }
}

export function formatPlatformInteger(n: number): string {
  return Math.round(n).toLocaleString("mn-MN");
}

export function formatPlatformRevenue(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0₮";
  return `${Math.round(n).toLocaleString("mn-MN")}₮`;
}
