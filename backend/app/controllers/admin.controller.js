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

/** Mirrors admin news list previously loaded via Prisma. */
exports.newsList = async (req, res) => {
  try {
    const status = String(req.query?.status || "").trim();
    const where = status === "draft" ? { status: "draft" } : undefined;
    const rows = await db.NewsArticle.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: 200,
      attributes: ["id", "title", "slug", "status", "createdAt"],
      raw: true,
    });
    res.json({
      ok: true,
      rows: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      })),
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};

/** Mirrors admin bni-memberships list previously loaded via Prisma. */
exports.membershipsList = async (_req, res) => {
  try {
    const rows = await db.ChapterMembership.findAll({
      order: [["id", "DESC"]],
      limit: 200,
      attributes: ["id", "status"],
      include: [
        { model: db.PlatformAccount, as: "account", attributes: ["email"] },
        { model: db.Chapter, as: "chapter", attributes: ["name"] },
      ],
    });
    res.json({
      ok: true,
      rows: rows.map((r) => ({
        id: String(r.id),
        status: String(r.status ?? ""),
        account: { email: r.account?.email ?? "" },
        chapter: { name: r.chapter?.name ?? "" },
      })),
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
