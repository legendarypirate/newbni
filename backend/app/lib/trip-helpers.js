"use strict";

function readBookingTiers(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const label = String(row.label ?? "").trim();
    const priceRaw = row.price_mnt ?? row.priceMnt;
    const price_mnt = Math.max(0, Math.round(Number(priceRaw ?? 0)) || 0);
    if (!label) continue;
    const idRaw = String(row.id ?? "").trim();
    const id = idRaw || `tier_${i}`;
    out.push({
      id,
      label,
      subtitle: String(row.subtitle ?? "").trim(),
      price_mnt,
    });
  }
  return out;
}

function readExtras(raw) {
  const d = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return {
    short_description: String(d.short_description ?? ""),
    location: String(d.location ?? ""),
    total_seats: Math.max(1, Number(d.total_seats ?? 30) || 30),
    advance_percent: Math.max(0, Number(d.advance_percent ?? 20) || 20),
    booking_tiers: readBookingTiers(d.booking_tiers),
    booking_status_note: String(d.booking_status_note ?? "").trim(),
    trip_details_hero_url: String(d.trip_details_hero_url ?? "").trim(),
    trip_manager_phone: String(d.trip_manager_phone ?? "").trim(),
    trip_help_email: String(d.trip_help_email ?? "").trim(),
    trip_help_chat_url: String(d.trip_help_chat_url ?? "").trim(),
    trip_registration_close_date: String(d.trip_registration_close_date ?? "").trim(),
  };
}

module.exports = {
  readExtras,
  readBookingTiers,
};
