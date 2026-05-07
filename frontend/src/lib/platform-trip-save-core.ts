import { serverAuthedFetch } from "@/lib/server-authed-fetch";

function parseDateOnly(s: string): Date | null {
  const t = s.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return null;
  }
  const d = new Date(`${t}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type SaveTripCoreResult = { kind: "saved" } | { kind: "redirect"; to: string };

export type ExecuteSaveTripOptions = {
  /** Base path for validation/error redirects (no query). Default `/platform/trips`. */
  errorRedirectBase?: string;
};

/**
 * Trip upsert: multipart POST to `/api/platform/trips/save` (images + JSON handled on the Node API).
 */
export async function executeSaveTrip(
  _accountId: bigint,
  formData: FormData,
  options?: ExecuteSaveTripOptions,
): Promise<SaveTripCoreResult> {
  void _accountId;
  const errBase = (options?.errorRedirectBase ?? "/platform/trips").replace(/\/$/, "") || "/platform/trips";

  const destination = String(formData.get("trip_destination") ?? "").trim();
  const start = parseDateOnly(String(formData.get("trip_start_date") ?? ""));
  const end = parseDateOnly(String(formData.get("trip_end_date") ?? ""));

  if (destination === "" || !start || !end) {
    return { kind: "redirect", to: `${errBase}?error=missing` };
  }
  if (end < start) {
    return { kind: "redirect", to: `${errBase}?error=dates` };
  }

  try {
    const res = await serverAuthedFetch("/platform/trips/save", {
      method: "POST",
      body: formData,
    });
    if (res.status === 404) {
      return { kind: "redirect", to: `${errBase}?error=notfound` };
    }
    if (!res.ok) {
      return { kind: "redirect", to: `${errBase}?error=missing` };
    }
    return { kind: "saved" };
  } catch {
    return { kind: "redirect", to: `${errBase}?error=missing` };
  }
}
