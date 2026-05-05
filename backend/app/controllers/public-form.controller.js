"use strict";

const forms = require("../services/trip-registration-forms");
const db = require("../models");
const {
  parseLegacyRegistrationArray,
  stableLegacyQuestionId,
  syncTripRegistrationFormFromLegacyJson,
} = require("../lib/trip-form-sync");
const crypto = require("crypto");

function mapQuestionToDrawer(q) {
  const options = Array.isArray(q.options) ? q.options.map((o) => o.value || o.label).filter(Boolean) : [];
  const t = String(q.type || "SHORT_TEXT");
  let type = "text";
  if (t === "LONG_TEXT") type = "textarea";
  else if (t === "DROPDOWN") type = "select";
  else if (t === "MULTIPLE_CHOICE" || t === "YES_NO") type = "radio";
  else if (t === "CHECKBOXES") type = "checkbox";
  else if (t === "EMAIL") type = "email";
  else if (t === "PHONE") type = "tel";
  else if (t === "NUMBER") type = "number";
  return {
    name: String(q.id),
    label: String(q.label || ""),
    required: Boolean(q.isRequired),
    placeholder: String(q.placeholder || ""),
    type,
    ...(options.length ? { options } : {}),
  };
}

function mapLegacyRowsToDrawer(rows) {
  return rows
    .filter((r) => String(r.label || "").trim() !== "")
    .map((r, idx) => {
      const t = String(r.type || "text");
      let type = "text";
      if (t === "textarea") type = "textarea";
      else if (t === "select") type = "select";
      else if (t === "radio") type = "radio";
      else if (t === "checkbox") type = "checkbox";
      else if (t === "email") type = "email";
      else if (t === "tel") type = "tel";
      else if (t === "number") type = "number";
      return {
        name: stableLegacyQuestionId(r.name, idx),
        label: String(r.label || ""),
        required: Number(r.required || 0) === 1,
        placeholder: String(r.placeholder || ""),
        type,
        ...(Array.isArray(r.options) && r.options.length ? { options: r.options } : {}),
      };
    });
}

function defaultDrawerSchema() {
  return [
    {
      name: "full_name",
      label: "Бүтэн нэр",
      required: true,
      placeholder: "Овог нэр",
      type: "text",
    },
    {
      name: "phone",
      label: "Утасны дугаар",
      required: true,
      placeholder: "",
      type: "tel",
    },
    {
      name: "email",
      label: "Имэйл хаяг",
      required: true,
      placeholder: "",
      type: "email",
    },
  ];
}

async function ensurePublishedTripForm(tripId) {
  let form = await db.TripRegistrationForm.findOne({
    where: { tripId, isPublished: true },
    attributes: ["id", "tripId", "eventId", "title", "publicSlug"],
  });
  if (form) return form;

  const trip = await db.BusinessTrip.findByPk(tripId, {
    attributes: ["id", "destination", "registrationFormJson"],
  });
  if (!trip) return null;

  if (trip.registrationFormJson) {
    try {
      await syncTripRegistrationFormFromLegacyJson(tripId, trip.registrationFormJson);
    } catch (e) {
      console.error("[ensurePublishedTripForm] syncTripRegistrationFormFromLegacyJson", e);
    }
    form = await db.TripRegistrationForm.findOne({
      where: { tripId, isPublished: true },
      attributes: ["id", "tripId", "eventId", "title", "publicSlug"],
    });
    if (form) return form;
  }

  const now = new Date();
  const created = await db.TripRegistrationForm.create({
    id: crypto.randomUUID(),
    tripId,
    title: trip.destination?.trim() || "Бүртгэлийн хураангуй",
    description: null,
    publicSlug: `t${crypto.randomBytes(8).toString("hex")}`,
    isPublished: true,
    settings: { thankYouMn: "Таны бүртгэл амжилттай илгээгдлээ." },
    createdAt: now,
    updatedAt: now,
  });

  const base = defaultDrawerSchema();
  for (let i = 0; i < base.length; i++) {
    const q = base[i];
    await db.TripFormQuestion.create({
      id: crypto.randomUUID(),
      formId: created.id,
      label: q.label,
      type: q.type === "tel" ? "PHONE" : q.type === "email" ? "EMAIL" : "SHORT_TEXT",
      placeholder: q.placeholder,
      isRequired: q.required,
      sortOrder: i,
      retiredFromForm: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  return created;
}

async function savePublicResponseByForm(form, answers) {
  const payload = Array.isArray(answers) ? answers : [];
  const now = new Date();
  const response = await db.TripFormResponse.create({
    id: crypto.randomUUID(),
    formId: form.id,
    tripId: form.tripId || null,
    eventId: form.eventId || null,
    status: "SUBMITTED",
    paymentStatus: "UNPAID",
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  for (const a of payload) {
    const questionId = String(a?.questionId || "").trim();
    if (!questionId) continue;
    const value = a?.value == null ? null : String(a.value);
    const fileUrl = a?.fileUrl == null ? null : String(a.fileUrl);
    await db.TripFormResponseAnswer.create({
      id: crypto.randomUUID(),
      responseId: response.id,
      questionId,
      value,
      fileUrl,
      createdAt: now,
    });
  }

  return response.id;
}

exports.getPublished = async (req, res) => {
  const { publicSlug } = req.params;
  const form = await forms.getPublishedFormBundleBySlug(publicSlug);
  if (!form) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const trip =
    form.trip &&
    ({
      id: form.trip.id,
      destination: form.trip.destination,
      startDate: form.trip.startDate,
      endDate: form.trip.endDate,
      coverImageUrl: form.trip.coverImageUrl,
    });

  res.json({
    form: {
      title: form.title,
      description: form.description,
      publicSlug: form.publicSlug,
      settings: form.settings,
      trip,
      questions: (form.questions || []).map((q) => ({
        id: q.id,
        label: q.label,
        description: q.description,
        type: q.type,
        placeholder: q.placeholder,
        isRequired: q.isRequired,
        sortOrder: q.sortOrder,
        options: (q.options || []).map((o) => ({ id: o.id, label: o.label, value: o.value })),
      })),
    },
  });
};

exports.getPublicTripById = async (req, res) => {
  const tripId = Number.parseInt(req.params.tripId, 10);
  if (!Number.isFinite(tripId) || tripId < 1) {
    return res.status(400).json({ success: false, message: "bad_trip_id" });
  }

  const trip = await db.BusinessTrip.findByPk(tripId);
  if (!trip) return res.status(404).json({ success: false, message: "NOT_FOUND" });

  const publishedForm = await db.TripRegistrationForm.findOne({
    where: { tripId, isPublished: true },
    attributes: ["publicSlug"],
    order: [["updatedAt", "DESC"]],
  });

  return res.json({
    success: true,
    trip: trip.toJSON(),
    registrationPublicSlug: publishedForm?.publicSlug || null,
  });
};

exports.getPublicTripRegistration = async (req, res) => {
  const tripId = Number.parseInt(req.params.tripId, 10);
  if (!Number.isFinite(tripId) || tripId < 1) {
    return res.status(400).json({ success: false, message: "bad_trip_id" });
  }

  await ensurePublishedTripForm(tripId);
  const form = await db.TripRegistrationForm.findOne({
    where: { tripId, isPublished: true },
    include: [
      { model: db.BusinessTrip, as: "trip", attributes: ["destination"] },
      {
        model: db.TripFormQuestion,
        as: "questions",
        where: { retiredFromForm: false },
        required: false,
        include: [{ model: db.TripFormQuestionOption, as: "options", required: false }],
      },
    ],
    order: [[{ model: db.TripFormQuestion, as: "questions" }, "sortOrder", "ASC"]],
  });

  if (form && Array.isArray(form.questions) && form.questions.length > 0) {
    return res.json({
      success: true,
      tripTitle: form.trip?.destination?.trim() || "Бизнес аялал",
      schema: form.questions.map(mapQuestionToDrawer),
    });
  }

  const trip = await db.BusinessTrip.findByPk(tripId, {
    attributes: ["destination", "registrationFormJson"],
  });
  if (!trip) {
    return res.status(404).json({ success: false, message: "NOT_FOUND" });
  }
  const legacy = mapLegacyRowsToDrawer(parseLegacyRegistrationArray(trip.registrationFormJson));
  if (legacy.length === 0) {
    return res.status(404).json({ success: false, message: "NOT_FOUND" });
  }
  return res.json({
    success: true,
    tripTitle: trip.destination?.trim() || "Бизнес аялал",
    schema: legacy,
  });
};

exports.postPublicTripRegistration = async (req, res) => {
  const tripId = Number.parseInt(req.params.tripId, 10);
  if (!Number.isFinite(tripId) || tripId < 1) {
    return res.status(400).json({ success: false, message: "bad_trip_id" });
  }
  await ensurePublishedTripForm(tripId);
  const form = await db.TripRegistrationForm.findOne({
    where: { tripId, isPublished: true },
    attributes: ["id", "tripId", "eventId"],
  });
  if (!form) return res.status(404).json({ success: false, message: "NOT_FOUND" });

  const responseId = await savePublicResponseByForm(form, req.body?.answers);
  return res.json({ success: true, responseId, message: "Таны бүртгэлийг амжилттай хүлээн авлаа." });
};

exports.getPublicEventRegistration = async (req, res) => {
  const eventId = req.params.eventId;
  const form = await db.TripRegistrationForm.findOne({
    where: { eventId, isPublished: true },
    include: [
      { model: db.BniEvent, as: "event", attributes: ["title", "registrationFormJson"] },
      {
        model: db.TripFormQuestion,
        as: "questions",
        where: { retiredFromForm: false },
        required: false,
        include: [{ model: db.TripFormQuestionOption, as: "options", required: false }],
      },
    ],
    order: [[{ model: db.TripFormQuestion, as: "questions" }, "sortOrder", "ASC"]],
  });

  if (form && Array.isArray(form.questions) && form.questions.length > 0) {
    return res.json({
      success: true,
      tripTitle: form.event?.title?.trim() || "Арга хэмжээ",
      schema: form.questions.map(mapQuestionToDrawer),
    });
  }

  const ev = await db.BniEvent.findByPk(eventId, {
    attributes: ["title", "registrationFormJson"],
  });
  if (!ev) return res.status(404).json({ success: false, message: "NOT_FOUND" });
  const legacy = mapLegacyRowsToDrawer(parseLegacyRegistrationArray(ev.registrationFormJson));
  if (legacy.length === 0) return res.status(404).json({ success: false, message: "NOT_FOUND" });

  return res.json({
    success: true,
    tripTitle: ev.title?.trim() || "Арга хэмжээ",
    schema: legacy,
  });
};

exports.postPublicEventRegistration = async (req, res) => {
  const eventId = req.params.eventId;
  const form = await db.TripRegistrationForm.findOne({
    where: { eventId, isPublished: true },
    attributes: ["id", "tripId", "eventId"],
  });
  if (!form) return res.status(404).json({ success: false, message: "NOT_FOUND" });

  const responseId = await savePublicResponseByForm(form, req.body?.answers);
  return res.json({ success: true, responseId, message: "Таны бүртгэлийг амжилттай хүлээн авлаа." });
};

exports.postPublicFormResponseBySlug = async (req, res) => {
  const publicSlug = String(req.params.publicSlug || "").trim();
  if (!publicSlug) return res.status(400).json({ ok: false, error: "bad_slug" });

  const form = await db.TripRegistrationForm.findOne({
    where: { publicSlug, isPublished: true },
    attributes: ["id", "tripId", "eventId"],
  });
  if (!form) return res.status(404).json({ ok: false, error: "not_found" });

  const responseId = await savePublicResponseByForm(form, req.body?.answers);
  return res.json({ ok: true, responseId });
};
