"use strict";

const { Op } = require("sequelize");
const db = require("../models");
const { translateRecords, translateOne } = require("../lib/content-translations");
const { syncEventRegistrationFormFromLegacyJson } = require("../lib/trip-form-sync");
const {
  EVENT_STATUS,
  isAdminUser,
  readEventApprovalStatus,
  mergeEventApprovalStatus,
} = require("../lib/content-approval");
const tripForms = require("../services/trip-registration-forms");

async function publishedEventIdSet() {
  const rows = await db.TripRegistrationForm.findAll({
    where: { eventId: { [Op.ne]: null }, isPublished: true },
    attributes: ["eventId"],
    raw: true,
  });
  return new Set(rows.map((r) => String(r.eventId)));
}

function eventIsPublic(ev, publishedIds) {
  const env = ev.curriculumOverrideJson;
  if (readEventApprovalStatus(env) === EVENT_STATUS.PUBLISHED) return true;
  if (publishedIds.has(String(ev.id))) return true;
  return false;
}

async function publishEventRegistrationForms(eventId) {
  const forms = await db.TripRegistrationForm.findAll({
    where: { eventId },
    order: [["createdAt", "ASC"]],
    attributes: ["id"],
  });
  if (forms.length === 0) return;
  await tripForms.setTripRegistrationFormPublished(forms[0].id, null, true, { adminBypass: true });
}

async function unpublishEventRegistrationForms(eventId) {
  await db.TripRegistrationForm.update({ isPublished: false }, { where: { eventId } });
}

exports.listPublic = async (req, res) => {
  try {
    const { chapter, status = "upcoming", event_type, q, date_from, date_to } = req.query;
    const now = new Date();
    const where = {};

    if (status === "upcoming") {
      where.endsAt = { [Op.gte]: now };
    } else if (status === "past") {
      where.endsAt = { [Op.lt]: now };
    }

    const chapterId = parseInt(chapter);
    if (!isNaN(chapterId) && chapterId > 0) {
      where.chapterId = chapterId;
    }

    if (event_type && event_type !== "all") {
      where.eventType = event_type;
    }

    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { "$chapter.name$": { [Op.iLike]: `%${q}%` } },
        { "$chapter.region.name$": { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (date_from || date_to) {
      where.startsAt = {};
      if (date_from) where.startsAt[Op.gte] = new Date(`${date_from}T00:00:00Z`);
      if (date_to) where.startsAt[Op.lte] = new Date(`${date_to}T23:59:59Z`);
    }

    const rowsRaw = await db.BniEvent.findAll({
      where,
      include: [
        {
          model: db.Chapter,
          as: "chapter",
          include: [{ model: db.Region, as: "region" }],
        },
        {
          model: db.Curriculum,
          as: "curriculum",
          attributes: ["agendaJson", "name"],
        },
      ],
      order: status === "past" 
        ? [["startsAt", "DESC"], ["id", "DESC"]]
        : [["startsAt", "ASC"], ["id", "ASC"]],
      limit: 200,
    });

    const publishedIds = await publishedEventIdSet();
    const rows = rowsRaw.filter((ev) => eventIsPublic(ev, publishedIds)).slice(0, 80);
    const lang = req.bniLang || "mn";
    const eventsOut = await translateRecords(rows, "event", lang);

    const [totalUpcoming, totalPast, distinctChapters] = await Promise.all([
      db.BniEvent.count({ where: { endsAt: { [Op.gte]: now } } }),
      db.BniEvent.count({ where: { endsAt: { [Op.lt]: now } } }),
      db.BniEvent.findAll({
        attributes: [[db.sequelize.fn("DISTINCT", db.sequelize.col("chapter_id")), "chapterId"]],
        raw: true,
      }),
    ]);

    res.json({
      ok: true,
      data: {
        events: eventsOut,
        totalUpcoming,
        totalPast,
        chaptersWithEvents: distinctChapters.length,
      },
    });
  } catch (err) {
    console.error("events list failed:", err);
    res.json({ ok: false, events: [] });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await db.BniEvent.findByPk(id, {
      include: [
        {
          model: db.Chapter,
          as: "chapter",
          include: [{ model: db.Region, as: "region" }],
        },
        {
          model: db.Curriculum,
          as: "curriculum",
        },
      ],
    });
    if (!event) return res.status(404).json({ ok: false, message: "Event not found" });

    const publishedIds = await publishedEventIdSet();
    const isPublic = eventIsPublic(event, publishedIds);
    if (!isPublic) {
      return res.status(404).json({ ok: false, message: "Event not found" });
    }

    const [registeredTotal, publishedForm, similar] = await Promise.all([
      db.TripFormResponse.count({ where: { eventId: id } }),
      db.TripRegistrationForm.findOne({
        where: { eventId: id, isPublished: true },
        attributes: ["publicSlug"],
      }),
      event.chapterId
        ? db.BniEvent.findAll({
            where: {
              chapterId: event.chapterId,
              id: { [Op.ne]: event.id },
              endsAt: { [Op.gte]: new Date() },
            },
            order: [["startsAt", "ASC"], ["id", "ASC"]],
            limit: 8,
            include: [{ model: db.Chapter, as: "chapter", attributes: ["name"] }],
          })
        : Promise.resolve([]),
    ]);

    const lang = req.bniLang || "mn";
    const eventOut = await translateOne(event, "event", lang, { autoFillMissing: true });
    const similarOut = await translateRecords(similar, "event", lang);

    res.json({
      ok: true,
      data: {
        event: eventOut,
        registeredTotal,
        publishedForm,
        similar: similarOut,
      },
    });
  } catch (err) {
    console.error("event get failed:", err);
    res.status(500).json({ ok: false, message: "failed" });
  }
};
exports.upsert = async (req, res) => {
  try {
    const eventId = parseInt(req.body?.eventId);
    const title = String(req.body?.title || "").trim();
    const startsAt = req.body?.startsAt ? new Date(req.body.startsAt) : null;
    const endsAt = req.body?.endsAt ? new Date(req.body.endsAt) : null;

    if (!title || !startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      return res.status(400).json({ ok: false, errorKey: "missing" });
    }

    const isAdmin = isAdminUser(req.user);
    let envelope = req.body?.curriculumOverrideJson || null;
    if (!isAdmin) {
      envelope = mergeEventApprovalStatus(envelope, EVENT_STATUS.PENDING);
    } else if (envelope && readEventApprovalStatus(envelope) === EVENT_STATUS.PUBLISHED) {
      envelope = mergeEventApprovalStatus(envelope, EVENT_STATUS.PUBLISHED);
    }

    const payload = {
      chapterId: parseInt(req.body?.chapterId) > 0 ? parseInt(req.body?.chapterId) : null,
      eventType: String(req.body?.eventType || "event").trim() || "event",
      title,
      startsAt,
      endsAt,
      location: String(req.body?.location || "").trim() || null,
      isOnline: Boolean(req.body?.isOnline),
      scheduleId: parseInt(req.body?.scheduleId) > 0 ? parseInt(req.body?.scheduleId) : null,
      curriculumId: parseInt(req.body?.curriculumId) > 0 ? parseInt(req.body?.curriculumId) : null,
      curriculumOverrideJson: envelope,
      registrationFormJson: req.body?.registrationFormJson || null,
      priceMnt: req.body?.priceMnt || null,
      advanceOrderMnt: req.body?.advanceOrderMnt || null,
    };

    let savedId = eventId;
    if (eventId > 0) {
      const exists = await db.BniEvent.findByPk(eventId);
      if (!exists) return res.status(404).json({ ok: false, errorKey: "notfound" });
      await exists.update(payload);
    } else {
      const created = await db.BniEvent.create(payload);
      savedId = created.id;
    }

    try {
      await syncEventRegistrationFormFromLegacyJson(savedId, payload.registrationFormJson);
    } catch (e) {
      console.error("[events.upsert] syncEventRegistrationFormFromLegacyJson", e);
    }

    if (readEventApprovalStatus(payload.curriculumOverrideJson) === EVENT_STATUS.PUBLISHED) {
      await publishEventRegistrationForms(savedId);
    } else if (!isAdmin) {
      await unpublishEventRegistrationForms(savedId);
    }

    return res.json({ ok: true, id: String(savedId) });
  } catch (err) {
    console.error("events upsert failed:", err);
    res.status(500).json({ ok: false });
  }
};

exports.registrationFormMeta = async (req, res) => {
  const eventId = Math.max(0, Number(req.params.id || "0"));
  if (eventId < 1) return res.status(400).json({ ok: false, error: "invalid_id" });
  try {
    const ev = await db.BniEvent.findByPk(eventId, {
      attributes: ["id", "title", "startsAt", "endsAt", "curriculumOverrideJson"],
    });
    if (!ev) return res.status(404).json({ ok: false, error: "not_found" });

    const form = await db.TripRegistrationForm.findOne({
      where: { eventId },
      order: [["createdAt", "ASC"]],
      attributes: ["id", "publicSlug", "isPublished", "title"],
    });

    res.json({
      ok: true,
      event: {
        id: String(ev.id),
        title: ev.title,
        approvalStatus: readEventApprovalStatus(ev.curriculumOverrideJson),
      },
      form: form
        ? {
            id: form.id,
            publicSlug: form.publicSlug,
            isPublished: form.isPublished,
            title: form.title,
          }
        : null,
    });
  } catch (err) {
    console.error("event registrationFormMeta failed:", err);
    res.status(500).json({ ok: false, error: "failed" });
  }
};

exports.remove = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId) || eventId < 1) return res.status(400).json({ ok: false });
    await db.BniEvent.destroy({ where: { id: eventId } });
    res.json({ ok: true });
  } catch (err) {
    console.error("events remove failed:", err);
    res.status(500).json({ ok: false });
  }
};
