import { parseLegacyRegistrationArray } from "@/lib/trip-registration-form/sync-registration-form-from-json";

/**
 * Legacy array for `PlatformTripRegistrationJsonBuilder` when editing an event.
 * Uses `bni_events.registration_form_json` only (synced questions live on the API).
 */
export async function registrationLegacyJsonForEventEditor(
  _eventId: bigint,
  columnJson: unknown,
): Promise<unknown | undefined> {
  void _eventId;
  const fromColumn = parseLegacyRegistrationArray(columnJson).filter((r) => r.label.trim());
  return fromColumn.length > 0 ? fromColumn : undefined;
}
