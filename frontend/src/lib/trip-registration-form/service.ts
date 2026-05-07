import { internalApiUrl } from "@/lib/backend-api";
import type { TripFormQuestionType } from "@/lib/platform-db-types";

/** Public homepage drawer: JSON field types aligned with legacy PHP dynamic form renderer. */
export type HomeTripDrawerSchemaItem = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "select" | "radio" | "checkbox";
  required: boolean;
  placeholder: string;
  options?: string[];
};

export type PublishedFormBundle = {
  title: string;
  description: string | null;
  publicSlug: string;
  settings: unknown;
  trip: {
    id: number;
    destination: string;
    startDate: Date;
    endDate: Date;
    coverImageUrl: string | null;
  } | null;
  event: {
    id: bigint;
    title: string | null;
    startsAt: Date;
    endsAt: Date;
  } | null;
  questions: Array<{
    id: string;
    label: string;
    description: string | null;
    type: TripFormQuestionType;
    placeholder: string | null;
    isRequired: boolean;
    sortOrder: number;
    options: Array<{ id: string; label: string; value: string }>;
  }>;
};

function mapQuestionTypeToDrawer(
  type: TripFormQuestionType,
  options: { value: string }[],
  placeholder: string | null,
): Pick<HomeTripDrawerSchemaItem, "type" | "placeholder" | "options"> {
  const optVals = options.map((o) => o.value);
  const ph = placeholder ?? "";
  switch (type) {
    case "LONG_TEXT":
      return { type: "textarea", placeholder: ph };
    case "EMAIL":
      return { type: "email", placeholder: ph };
    case "PHONE":
      return { type: "tel", placeholder: ph };
    case "NUMBER":
      return { type: "number", placeholder: ph };
    case "DROPDOWN":
      return { type: "select", placeholder: ph, options: optVals.length ? optVals : undefined };
    case "MULTIPLE_CHOICE":
    case "YES_NO":
      return { type: "radio", placeholder: ph, options: optVals.length ? optVals : undefined };
    case "CHECKBOXES":
      return { type: "checkbox", placeholder: ph, options: optVals.length ? optVals : undefined };
    default:
      return { type: "text", placeholder: ph };
  }
}

/** Loads published trip/event registration form from the Node API (no Prisma). */
export async function getPublishedFormBundleBySlug(publicSlug: string): Promise<PublishedFormBundle | null> {
  const res = await fetch(internalApiUrl(`/api/public/forms/${encodeURIComponent(publicSlug)}`), {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const raw = (await res.json().catch(() => null)) as {
    error?: string;
    form?: {
      title: string;
      description: string | null;
      publicSlug: string;
      settings: unknown;
      trip?: {
        id: number;
        destination: string;
        startDate: string;
        endDate: string;
        coverImageUrl: string | null;
      } | null;
      event?: {
        id: string | number;
        title: string | null;
        startsAt: string;
        endsAt: string;
      } | null;
      questions: Array<{
        id: string;
        label: string;
        description: string | null;
        type: TripFormQuestionType;
        placeholder: string | null;
        isRequired: boolean;
        sortOrder: number;
        options: Array<{ id: string; label: string; value: string }>;
      }>;
    };
  };
  if (!raw?.form || raw.error) return null;
  const f = raw.form;
  return {
    title: f.title,
    description: f.description ?? null,
    publicSlug: f.publicSlug,
    settings: f.settings ?? null,
    trip: f.trip
      ? {
          id: f.trip.id,
          destination: f.trip.destination,
          startDate: new Date(f.trip.startDate),
          endDate: new Date(f.trip.endDate),
          coverImageUrl: f.trip.coverImageUrl ?? null,
        }
      : null,
    event: f.event
      ? {
          id: BigInt(String(f.event.id)),
          title: f.event.title,
          startsAt: new Date(f.event.startsAt),
          endsAt: new Date(f.event.endsAt),
        }
      : null,
    questions: (f.questions ?? []).map((q) => ({
      id: q.id,
      label: q.label,
      description: q.description ?? null,
      type: q.type,
      placeholder: q.placeholder ?? null,
      isRequired: Boolean(q.isRequired),
      sortOrder: q.sortOrder,
      options: q.options ?? [],
    })),
  };
}

export function publishedBundleToHomeDrawerSchema(bundle: PublishedFormBundle): HomeTripDrawerSchemaItem[] {
  return bundle.questions.map((q, idx) => {
    const mapped = mapQuestionTypeToDrawer(
      q.type,
      q.options.map((o) => ({ value: o.value })),
      q.placeholder,
    );
    return {
      name: q.id || `q_${idx}`,
      label: q.label,
      required: q.isRequired,
      ...mapped,
    };
  });
}
