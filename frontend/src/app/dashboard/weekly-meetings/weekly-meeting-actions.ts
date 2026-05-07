"use server";

import { revalidatePath } from "next/cache";
import type { BusyMeetingAttendanceStatus, BusyMeetingPaymentStatus } from "@/lib/platform-db-types";
import { serverAuthedFetch } from "@/lib/server-authed-fetch";
import type { CreateWeeklyMeetingInput, PublicRegisterMeetingInput } from "@/lib/meetings/weekly-meeting-types";

export type { CreateWeeklyMeetingInput, PublicRegisterMeetingInput } from "@/lib/meetings/weekly-meeting-types";

export async function createWeeklyMeetingAction(
  input: CreateWeeklyMeetingInput,
): Promise<{ ok: true; meetingId: string; publicToken: string } | { ok: false; error: string }> {
  try {
    const res = await serverAuthedFetch("/meetings/weekly", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || "FAILED" };

    revalidatePath("/dashboard/weekly-meetings");
    return { ok: true, meetingId: json.meetingId, publicToken: json.publicToken };
  } catch (e) {
    return { ok: false, error: "CONNECTION_ERROR" };
  }
}

export async function updateRegistrationStaffFieldsAction(input: {
  registrationId: string;
  weeklyMeetingId?: string;
  paymentStatus?: BusyMeetingPaymentStatus;
  attendanceStatus?: BusyMeetingAttendanceStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await serverAuthedFetch(`/meetings/weekly/registrations/${input.registrationId}`, {
      method: "PATCH",
      body: JSON.stringify({
        paymentStatus: input.paymentStatus,
        attendanceStatus: input.attendanceStatus,
      }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || "FAILED" };

    if (input.weeklyMeetingId) {
      revalidatePath(`/dashboard/weekly-meetings/${input.weeklyMeetingId}`);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "CONNECTION_ERROR" };
  }
}

export async function publicRegisterForWeeklyMeetingAction(
  input: PublicRegisterMeetingInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/meetings/weekly/register-public`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || "FAILED" };

    revalidatePath(`/m/${input.token}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "CONNECTION_ERROR" };
  }
}

export async function logRosterExportAction(input: {
  meetingId: string;
  format: string;
  rowCount: number;
}): Promise<void> {
  try {
    await serverAuthedFetch("/meetings/weekly/log-roster-export", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch {
    /* noop */
  }
}
