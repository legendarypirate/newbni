"use strict";

const { Op } = require("sequelize");
const db = require("../models");

/** Mirrors busybni admin dashboard aggregates — same PostgreSQL tables as Prisma */
exports.dashboardStats = async (_req, res) => {
  try {
    const [
      memberCount,
      newsPublished,
      newsDraft,
      chapterCount,
      eventUpcoming,
      recentMembers,
      recentNews,
    ] = await Promise.all([
      db.LegacyMember.count({ where: { status: "active" } }),
      db.NewsArticle.count({ where: { status: "published" } }),
      db.NewsArticle.count({ where: { status: "draft" } }),
      db.Chapter.count(),
      db.BniEvent.count({ where: { endsAt: { [Op.gte]: new Date() } } }),
      db.LegacyMember.findAll({
        where: { status: "active" },
        order: [["id", "DESC"]],
        limit: 5,
        attributes: ["id", "name", "company", "industry", "photo"],
        raw: true,
      }),
      db.NewsArticle.findAll({
        order: [["createdAt", "DESC"]],
        limit: 5,
        attributes: ["id", "title", "status", "createdAt"],
        raw: true,
      }),
    ]);

    res.json({
      ok: true,
      data: {
        memberCount,
        newsPublished,
        newsDraft,
        chapterCount,
        eventUpcoming,
        recentMembers,
        recentNews: recentNews.map((n) => ({
          ...n,
          createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
        })),
      },
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};

/** Mirrors admin members list previously loaded via Prisma. */
exports.membersList = async (_req, res) => {
  try {
    const rows = await db.LegacyMember.findAll({
      order: [["id", "DESC"]],
      limit: 300,
      attributes: ["id", "name", "company", "industry", "email", "status"],
      raw: true,
    });
    res.json({ ok: true, rows });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
