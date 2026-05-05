"use strict";

const forms = require("../services/trip-registration-forms");
const { statusFromError } = require("../utils/http-status");

exports.list = async (req, res) => {
  const tripId = Number.parseInt(req.params.tripId, 10);
  if (!Number.isFinite(tripId)) {
    res.status(400).json({ error: "bad_trip_id" });
    return;
  }
  try {
    const list = await forms.listTripFormsForOrganizer(tripId, req.platformUser.id);
    res.json({
      forms: list.map((f) => ({
        id: f.id,
        title: f.title,
        publicSlug: f.publicSlug,
        isPublished: f.isPublished,
        updatedAt: f.updatedAt instanceof Date ? f.updatedAt.toISOString() : String(f.updatedAt),
        responseCount: f._count.responses,
        questionCount: f._count.questions,
      })),
    });
  } catch (e) {
    res.status(statusFromError(e)).json({ error: "failed" });
  }
};

exports.create = async (req, res) => {
  const tripId = Number.parseInt(req.params.tripId, 10);
  if (!Number.isFinite(tripId)) {
    res.status(400).json({ error: "bad_trip_id" });
    return;
  }
  const body = req.body || {};
  try {
    const created = await forms.createTripRegistrationFormWithDefaults({
      tripId,
      title: body.title?.trim?.() || "Бүртгэлийн форм",
      description: body.description ?? null,
      actorAccountId: req.platformUser.id,
    });
    res.json({ ok: true, formId: created.formId, publicSlug: created.publicSlug });
  } catch (e) {
    const code = e instanceof Error ? e.message : "unknown";
    res.status(statusFromError(e)).json({ error: code });
  }
};
