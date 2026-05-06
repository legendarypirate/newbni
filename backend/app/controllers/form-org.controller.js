"use strict";

const forms = require("../services/trip-registration-forms");
const { statusFromError } = require("../utils/http-status");

function serializeForm(form) {
  const trip = form.trip
    ? {
        id: form.trip.id,
        destination: form.trip.destination,
        startDate: form.trip.startDate,
        endDate: form.trip.endDate,
        coverImageUrl: form.trip.coverImageUrl,
      }
    : null;

  return {
    id: form.id,
    tripId: form.tripId,
    eventId: form.eventId != null ? String(form.eventId) : null,
    title: form.title,
    description: form.description,
    publicSlug: form.publicSlug,
    isPublished: form.isPublished,
    settings: form.settings,
    updatedAt: form.updatedAt instanceof Date ? form.updatedAt.toISOString() : String(form.updatedAt),
    trip,
    questions: (form.questions || []).map((q) => ({
      id: q.id,
      label: q.label,
      description: q.description,
      type: q.type,
      placeholder: q.placeholder,
      isRequired: q.isRequired,
      sortOrder: q.sortOrder,
      options: (q.options || []).map((o) => ({
        id: o.id,
        label: o.label,
        value: o.value,
        sortOrder: o.sortOrder,
      })),
    })),
  };
}

exports.get = async (req, res) => {
  const { formId } = req.params;
  try {
    const form = await forms.getTripFormForOrganizer(formId, req.platformUser.id);
    if (!form) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ form: serializeForm(form) });
  } catch (e) {
    res.status(statusFromError(e)).json({ error: "failed" });
  }
};

exports.patch = async (req, res) => {
  const { formId } = req.params;
  const body = req.body || {};
  try {
    await forms.patchTripRegistrationForm(formId, req.platformUser.id, {
      title: body.title,
      description: body.description,
    });
    const form = await forms.getTripFormForOrganizer(formId, req.platformUser.id);
    if (!form) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ ok: true, form: serializeForm(form) });
  } catch (e) {
    res.status(statusFromError(e)).json({ error: "failed" });
  }
};

exports.delete = async (req, res) => {
  const { formId } = req.params;
  try {
    await forms.deleteTripRegistrationForm(formId, req.platformUser.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(statusFromError(e)).json({ error: "failed" });
  }
};

exports.addQuestion = async (req, res) => {
  const { formId } = req.params;
  const body = req.body || {};
  try {
    const q = await forms.addTripFormQuestion(formId, req.platformUser.id, body);
    res.json({ ok: true, questionId: q.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    res.status(statusFromError(e)).json({ error: msg });
  }
};
exports.listResponses = async (req, res) => {
  const { formId } = req.params;
  try {
    const list = await forms.listTripFormResponsesForOrganizer(formId, req.platformUser.id);
    res.json({
      responses: list.map((r) => ({
        id: r.id,
        submittedAt: r.submittedAt.toISOString(),
        status: r.status,
        paymentStatus: r.paymentStatus,
        internalNote: r.internalNote,
        orderSummary: r.orderSummary,
        hasParticipant: !!r.participant,
        answers: r.answers.map((a) => ({
          questionLabel: a.question?.label || "Unknown",
          questionType: a.question?.type || "SHORT_TEXT",
          value: a.value,
          fileUrl: a.fileUrl,
        })),
      })),
    });
  } catch (e) {
    res.status(statusFromError(e)).json({ error: "failed" });
  }
};

exports.patchResponseStatus = async (req, res) => {
  const { responseId } = req.params;
  const body = req.body || {};
  try {
    await forms.patchTripFormResponseStatus(responseId, req.platformUser.id, body);
    res.json({ ok: true });
  } catch (e) {
    res.status(statusFromError(e)).json({ error: "failed" });
  }
};

exports.convertToParticipant = async (req, res) => {
  const { responseId } = req.params;
  try {
    await forms.convertResponseToParticipant(responseId, req.platformUser.id);
    res.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    res.status(statusFromError(e)).json({ error: msg });
  }
};
