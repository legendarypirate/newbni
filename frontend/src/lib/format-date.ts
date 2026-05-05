/** Format legacy TIME (@db.Time) fields stored as UTC clock time. */
export function formatClockUtc(d: Date): string {
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function formatMnDate(d: Date | string | number | null | undefined): string {
  if (d == null) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, ".");
}
