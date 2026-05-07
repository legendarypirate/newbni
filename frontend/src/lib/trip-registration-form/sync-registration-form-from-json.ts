import type { TripFormQuestionType } from "@/lib/platform-db-types";

export type LegacyRegistrationRow = {
  name: string;
  label: string;
  type: string;
  required: number;
  placeholder: string;
  options: string[];
};

/** Stable id for legacy rows with empty `name` (must match drawer + DB). */
export function stableLegacyQuestionId(name: string, index: number): string {
  const t = name.trim();
  if (t.length > 0) return t;
  return `legacy_q_${index}`;
}

export function legacyStringToTripType(typeStr: string): TripFormQuestionType {
  switch (typeStr) {
    case "textarea":
      return "LONG_TEXT";
    case "email":
      return "EMAIL";
    case "tel":
      return "PHONE";
    case "number":
      return "NUMBER";
    case "date":
      return "DATE";
    case "select":
      return "DROPDOWN";
    case "radio":
      return "MULTIPLE_CHOICE";
    case "checkbox":
      return "CHECKBOXES";
    default:
      return "SHORT_TEXT";
  }
}

/** Inverse of {@link legacyStringToTripType} for rebuilding legacy JSON from `trip_form_questions`. */
export function tripTypeToLegacyString(t: TripFormQuestionType): string {
  switch (t) {
    case "LONG_TEXT":
      return "textarea";
    case "EMAIL":
      return "email";
    case "PHONE":
      return "tel";
    case "NUMBER":
      return "number";
    case "DATE":
      return "date";
    case "DROPDOWN":
      return "select";
    case "MULTIPLE_CHOICE":
      return "radio";
    case "CHECKBOXES":
      return "checkbox";
    default:
      return "text";
  }
}

export function needsTripOptions(t: TripFormQuestionType): boolean {
  return t === "MULTIPLE_CHOICE" || t === "CHECKBOXES" || t === "DROPDOWN";
}

/** Normalizes `business_trips.registration_form_json` array elements. */
export function parseLegacyRegistrationArray(registration: unknown): LegacyRegistrationRow[] {
  let v: unknown = registration;
  if (typeof v === "string" && v.trim()) {
    try {
      v = JSON.parse(v) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(v)) {
    return [];
  }
  return v
    .filter((x): x is Record<string, unknown> => x !== null && typeof x === "object")
    .map((x) => ({
      name: String(x.name ?? "").trim(),
      label: String(x.label ?? ""),
      type: String(x.type ?? "text"),
      required: Number(x.required ?? 0) ? 1 : 0,
      placeholder: String(x.placeholder ?? ""),
      options: Array.isArray(x.options) ? x.options.map((o) => String(o)).filter(Boolean) : [],
    }));
}
