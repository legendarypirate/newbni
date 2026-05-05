"use strict";

const db = require("../../models");

function parseNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseMoney(raw) {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return String(n);
}

function parseJsonOrNull(raw) {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

exports.bootstrap = async (req, res) => {
  try {
    const editEvent = String(req.query.edit_event || "").trim();
    const editId = editEvent ? Number(editEvent) : 0;

    const [chapters, schedules, curriculums, managedEvents, existing] = await Promise.all([
      db.Chapter.findAll({
        order: [[{ model: db.Region, as: "region" }, "name", "ASC"], ["name", "ASC"]],
        include: [{ model: db.Region, as: "region", attributes: ["name"] }],
      }),
      db.ChapterWeeklySchedule.findAll({
        limit: 500,
        order: [["id", "DESC"]],
        include: [
          { model: db.Chapter, as: "chapter", attributes: ["id", "name"] },
          { model: db.Curriculum, as: "curriculum", attributes: ["id", "name"] },
        ],
      }),
      db.Curriculum.findAll({
        order: [["name", "ASC"]],
        include: [{ model: db.Chapter, as: "chapter", attributes: ["id", "name"] }],
      }),
      db.BniEvent.findAll({
        limit: 100,
        order: [["startsAt", "DESC"]],
        include: [
          { model: db.Chapter, as: "chapter", attributes: ["id", "name"] },
          { model: db.Curriculum, as: "curriculum", attributes: ["id", "name"] },
        ],
      }),
      editId > 0 ? db.BniEvent.findByPk(editId) : null,
    ]);

    res.json({
      ok: true,
      chapters: chapters.map((ch) => ({
        id: ch.id,
        name: ch.name,
        region: { name: ch.region?.name || "" },
      })),
      schedules: schedules.map((sc) => ({
        id: sc.id,
        chapter: { id: sc.chapter?.id, name: sc.chapter?.name || "" },
        curriculum: { id: sc.curriculum?.id, name: sc.curriculum?.name || "" },
      })),
      curriculums: curriculums.map((cu) => ({
        id: cu.id,
        name: cu.name,
        chapter: cu.chapter ? { id: cu.chapter.id, name: cu.chapter.name } : null,
      })),
      managedEvents: managedEvents.map((ev) => ({
        id: String(ev.id),
        title: ev.title,
        chapter: ev.chapter ? { id: ev.chapter.id, name: ev.chapter.name } : null,
        curriculum: ev.curriculum ? { id: ev.curriculum.id, name: ev.curriculum.name } : null,
        eventType: ev.eventType,
        startsAt: ev.startsAt,
        endsAt: ev.endsAt,
        location: ev.location,
        isOnline: ev.isOnline,
        scheduleId: ev.scheduleId,
        curriculumId: ev.curriculumId,
        chapterId: ev.chapterId,
        priceMnt: ev.priceMnt,
        advanceOrderMnt: ev.advanceOrderMnt,
      })),
      existing: existing
        ? {
            id: String(existing.id),
            title: existing.title,
            chapterId: existing.chapterId,
            eventType: existing.eventType,
            startsAt: existing.startsAt,
            endsAt: existing.endsAt,
            location: existing.location,
            isOnline: existing.isOnline,
            scheduleId: existing.scheduleId,
            curriculumId: existing.curriculumId,
            priceMnt: existing.priceMnt,
            advanceOrderMnt: existing.advanceOrderMnt,
            curriculumOverrideJson: existing.curriculumOverrideJson,
            registrationFormJson: existing.registrationFormJson,
          }
        : null,
    });
  } catch (err) {
    console.error("admin events bootstrap failed:", err);
    res.status(500).json({ ok: false });
  }
};

exports.upsert = async (req, res) => {
  try {
    const eventId = parseNum(req.body?.eventId);
    const title = String(req.body?.title || "").trim();
    const startsAt = req.body?.startsAt ? new Date(req.body.startsAt) : null;
    const endsAt = req.body?.endsAt ? new Date(req.body.endsAt) : null;

    if (!title || !startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      return res.status(400).json({ ok: false, errorKey: "missing" });
    }

    const payload = {
      chapterId: parseNum(req.body?.chapterId) > 0 ? parseNum(req.body?.chapterId) : null,
      eventType: String(req.body?.eventType || "event").trim() || "event",
      title,
      startsAt,
      endsAt,
      location: String(req.body?.location || "").trim() || null,
      isOnline: Boolean(req.body?.isOnline),
      scheduleId: parseNum(req.body?.scheduleId) > 0 ? parseNum(req.body?.scheduleId) : null,
      curriculumId: parseNum(req.body?.curriculumId) > 0 ? parseNum(req.body?.curriculumId) : null,
      curriculumOverrideJson: req.body?.curriculumOverrideJson || null,
      registrationFormJson: req.body?.registrationFormJson || null,
      priceMnt: parseMoney(req.body?.priceMnt),
      advanceOrderMnt: parseMoney(req.body?.advanceOrderMnt),
    };

    if (eventId > 0) {
      const exists = await db.BniEvent.findByPk(eventId, { attributes: ["id"] });
      if (!exists) return res.status(404).json({ ok: false, errorKey: "notfound" });
      await db.BniEvent.update(payload, { where: { id: eventId } });
      return res.json({ ok: true, id: String(eventId) });
    }

    const created = await db.BniEvent.create(payload);
    return res.json({ ok: true, id: String(created.id) });
  } catch (err) {
    console.error("admin events upsert failed:", err);
    res.status(500).json({ ok: false });
  }
};

exports.remove = async (req, res) => {
  try {
    const eventId = parseNum(req.params.id);
    if (eventId < 1) return res.status(400).json({ ok: false });
    await db.BniEvent.destroy({ where: { id: eventId } });
    res.json({ ok: true });
  } catch (err) {
    console.error("admin events delete failed:", err);
    res.status(500).json({ ok: false });
  }
};
