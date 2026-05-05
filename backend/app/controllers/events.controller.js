"use strict";

const { Op } = require("sequelize");
const db = require("../models");

exports.listPublic = async (_req, res) => {
  try {
    const rows = await db.BniEvent.findAll({
      limit: 80,
      order: [["startsAt", "ASC"]],
      where: { endsAt: { [Op.gte]: new Date() } },
      attributes: ["id", "title", "startsAt", "endsAt", "eventType", "location"],
      include: [
        {
          model: db.Chapter,
          as: "chapter",
          attributes: ["name", "slug"],
          required: false,
          include: [
            {
              model: db.Region,
              as: "region",
              attributes: ["name", "slug"],
              required: false,
            },
          ],
        },
      ],
    });

    res.json({
      events: rows.map((e) => ({
        id: String(e.id),
        title: e.title,
        startsAt: e.startsAt instanceof Date ? e.startsAt.toISOString() : String(e.startsAt),
        endsAt: e.endsAt instanceof Date ? e.endsAt.toISOString() : String(e.endsAt),
        eventType: e.eventType,
        chapterName: e.chapter?.name ?? null,
        chapterSlug: e.chapter?.slug ?? null,
        regionName: e.chapter?.region?.name ?? null,
      })),
    });
  } catch {
    res.json({ events: [] });
  }
};
