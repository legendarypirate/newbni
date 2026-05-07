import WeeklyMeetingShell from "@/components/weekly-meeting/WeeklyMeetingShell";

/**
 * Auth is already enforced by the parent `DashboardAuthGate` in
 * `/dashboard/layout.tsx`; this layout only adds the weekly-meeting chrome.
 */
export const dynamic = "force-dynamic";

export default function WeeklyMeetingsAuthLayout({ children }: { children: React.ReactNode }) {
  return <WeeklyMeetingShell>{children}</WeeklyMeetingShell>;
}
