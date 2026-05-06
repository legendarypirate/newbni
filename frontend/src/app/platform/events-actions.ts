"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-session";
import { serverAuthedFetch } from "@/lib/server-authed-fetch";
import { parseEventDatetimeWireUb } from "@/lib/event-datetime-ub";
import { syncEventRegistrationFormFromLegacyJson } from "@/lib/trip-registration-form/sync-event-registration-form-from-json";

const ADMIN_EVENTS_PATH = "/admin/meetings";
const PLATFORM_EVENTS_PATH = "/platform/events";

function eventListPathFromFormData(formData: FormData): typeof ADMIN_EVENTS_PATH | typeof PLATFORM_EVENTS_PATH {
  return String(formData.get("return_context") ?? "").trim() === "admin" ? ADMIN_EVENTS_PATH : PLATFORM_EVENTS_PATH;
}

function parseMoney(raw: string): string | null {
  const t = raw.trim();
  if (t === "" || !Number.isFinite(Number(t))) {
    return null;
  }
  return t;
}

function parseRegistrationJson(raw: string): any | null {
  let v: unknown = raw.trim();
  if (v === "") return null;
  for (let depth = 0; depth < 3 && typeof v === "string"; depth++) {
    try {
      v = JSON.parse(v as string) as unknown;
    } catch {
      return null;
    }
  }
  if (Array.isArray(v) && v.length > 0) {
    return v;
  }
  return null;
}

function parseSections(raw: string): Record<string, unknown>[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function parseExistingEnvelopeObject(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === "string" && raw.trim()) {
    try {
      const j = JSON.parse(raw) as unknown;
      if (j && typeof j === "object" && !Array.isArray(j)) {
        return { ...(j as Record<string, unknown>) };
      }
    } catch {
      return {};
    }
    return {};
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) };
  }
  return {};
}

export async function saveEventAction(formData: FormData): Promise<void> {
  const listPath = eventListPathFromFormData(formData);
  const session = await getPlatformSession();
  if (!session) {
    redirect(
      listPath === ADMIN_EVENTS_PATH
        ? `/admin/login?next=${encodeURIComponent(ADMIN_EVENTS_PATH)}`
        : "/auth/login?next=/platform/events",
    );
  }
  const eventIdRaw = String(formData.get("event_id") ?? "0").trim();
  let eventId = 0;
  try {
    eventId = parseInt(eventIdRaw === "" ? "0" : eventIdRaw);
  } catch {
    eventId = 0;
  }

  const chapterIdRaw = String(formData.get("chapter_id") ?? "").trim();
  const chapterIdNum = Math.max(0, Number(chapterIdRaw === "" ? "0" : chapterIdRaw));
  const chapterId = chapterIdNum > 0 ? chapterIdNum : null;
  const eventType = String(formData.get("event_type") ?? "event").trim() || "event";
  const title = String(formData.get("title") ?? "").trim();
  const startsAt = parseEventDatetimeWireUb(String(formData.get("starts_at") ?? ""));
  const endsAt = parseEventDatetimeWireUb(String(formData.get("ends_at") ?? ""));
  const location = String(formData.get("location") ?? "").trim() || null;
  const isOnline = formData.get("is_online") === "1";
  const scheduleId = Math.max(0, Number(String(formData.get("schedule_id") ?? "0")));
  const curriculumId = Math.max(0, Number(String(formData.get("curriculum_id") ?? "0")));

  const introBody = String(formData.get("event_intro_body") ?? "").trim();
  const audienceText = String(formData.get("audience_text") ?? "").trim();

  const speakerNames = formData.getAll("speaker_name").map(String);
  const speakerRoles = formData.getAll("speaker_role").map(String);
  const speakerPhotos = formData.getAll("speaker_photo_url").map(String);
  const speakersOut: { name: string; role: string; photo_url: string }[] = [];
  const spkLen = Math.max(speakerNames.length, speakerRoles.length, speakerPhotos.length);
  for (let si = 0; si < spkLen; si++) {
    const sn = speakerNames[si]?.trim() ?? "";
    const sr = speakerRoles[si]?.trim() ?? "";
    const sp = speakerPhotos[si]?.trim() ?? "";
    if (sn === "" && sr === "" && sp === "") {
      continue;
    }
    speakersOut.push({ name: sn, role: sr, photo_url: sp });
  }

  const faqQs = formData.getAll("faq_question").map(String);
  const faqAs = formData.getAll("faq_answer").map(String);
  const faqOut: { question: string; answer: string }[] = [];
  const faqLen = Math.max(faqQs.length, faqAs.length);
  for (let fi = 0; fi < faqLen; fi++) {
    const fq = faqQs[fi]?.trim() ?? "";
    const fa = faqAs[fi]?.trim() ?? "";
    if (fq === "" && fa === "") {
      continue;
    }
    faqOut.push({ question: fq, answer: fa });
  }

  const agendaSections = parseSections(String(formData.get("event_sections_json") ?? ""));

  const envelope: Record<string, unknown> = {};
  envelope.sections = agendaSections;
  envelope.speakers = speakersOut;
  envelope.faq = faqOut;
  if (introBody !== "") {
    envelope.intro_body = introBody;
  }
  if (audienceText !== "") {
    envelope.audience_text = audienceText;
  }

  const heroImageUrl = String(formData.get("hero_image_url") ?? "").trim();
  if (heroImageUrl !== "") {
    envelope.hero_image_url = heroImageUrl;
  }

  const eventManagerPhone = String(formData.get("event_manager_phone") ?? "").trim();
  const eventHelpEmail = String(formData.get("event_help_email") ?? "").trim();
  const eventHelpChatUrl = String(formData.get("event_help_chat_url") ?? "").trim();
  if (eventManagerPhone !== "") envelope.event_manager_phone = eventManagerPhone;
  if (eventHelpEmail !== "") envelope.event_help_email = eventHelpEmail;
  if (eventHelpChatUrl !== "") envelope.event_help_chat_url = eventHelpChatUrl;

  const regParsedRaw = parseRegistrationJson(String(formData.get("event_registration_form_json") ?? ""));
  const priceMnt = parseMoney(String(formData.get("price_mnt") ?? ""));
  const advanceOrderMnt = parseMoney(String(formData.get("advance_order_mnt") ?? ""));

  if (!startsAt || !endsAt || endsAt <= startsAt || title === "") {
    redirect(`${listPath}?error=missing`);
  }

  const payload = {
    eventId,
    chapterId,
    eventType,
    title,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    location,
    isOnline,
    scheduleId,
    curriculumId,
    curriculumOverrideJson: Object.keys(envelope).length > 0 ? envelope : null,
    registrationFormJson: regParsedRaw,
    priceMnt: priceMnt?.toString() ?? null,
    advanceOrderMnt: advanceOrderMnt?.toString() ?? null,
  };

  const endpoint = listPath === ADMIN_EVENTS_PATH ? "/admin/events" : "/events";
  const finalEndpoint = eventId > 0 ? `${endpoint}/${eventId}` : endpoint;
  const method = eventId > 0 ? "PATCH" : "POST";

  try {
    const res = await serverAuthedFetch(finalEndpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const out = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; errorKey?: string };
    if (!res.ok || !out.ok) {
      if (out.errorKey === "notfound") redirect(`${listPath}?error=notfound`);
      redirect(`${listPath}?error=missing`);
    }

    const savedId = out.id ?? String(eventId);
    
    // For now, keep sync logic in frontend until backend handles it
    if (listPath !== ADMIN_EVENTS_PATH) {
       await syncEventRegistrationFormFromLegacyJson(BigInt(savedId), regParsedRaw);
    }

    revalidatePath("/platform/events");
    revalidatePath(ADMIN_EVENTS_PATH);
    revalidatePath("/events");
    revalidatePath(`/events/${savedId}`);
    redirect(listPath);
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    redirect(`${listPath}?error=missing`);
  }
}

export async function deleteEventAction(formData: FormData): Promise<void> {
  const listPath = eventListPathFromFormData(formData);
  const session = await getPlatformSession();
  if (!session) {
    redirect(
      listPath === ADMIN_EVENTS_PATH
        ? `/admin/login?next=${encodeURIComponent(ADMIN_EVENTS_PATH)}`
        : "/auth/login?next=/platform/events",
    );
  }
  const raw = String(formData.get("event_id") ?? "0").trim();
  const eventId = raw === "" ? "0" : raw;

  if (eventId === "0") {
    redirect(listPath);
  }

  const endpoint = listPath === ADMIN_EVENTS_PATH ? `/admin/events/${eventId}` : `/events/${eventId}`;

  try {
    await serverAuthedFetch(endpoint, { method: "DELETE" });
  } catch {
    redirect(listPath);
  }

  revalidatePath("/platform/events");
  revalidatePath(ADMIN_EVENTS_PATH);
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  redirect(listPath);
}
