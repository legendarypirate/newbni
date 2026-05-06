"use strict";

const { Op } = require("sequelize");
const db = require("../models");

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

    const rows = await db.BniEvent.findAll({
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
      limit: 80,
    });

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
        events: rows,
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

    res.json({
      ok: true,
      data: {
        event,
        registeredTotal,
        publishedForm,
        similar,
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
      curriculumOverrideJson: req.body?.curriculumOverrideJson || null,
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

    // TODO: syncEventRegistrationFormFromLegacyJson logic in backend
    
    return res.json({ ok: true, id: String(savedId) });
  } catch (err) {
    console.error("events upsert failed:", err);
    res.status(500).json({ ok: false });
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
