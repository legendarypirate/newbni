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

exports.paymentOrdersList = async (_req, res) => {
  try {
    const rows = await db.PaymentOrder.findAll({
      order: [["id", "DESC"]],
      limit: 200,
      attributes: ["id", "orderRef", "targetType", "targetId", "amountMnt", "status", "createdAt"],
      raw: true,
    });
    res.json({
      ok: true,
      rows: rows.map((r) => ({
        ...r,
        id: String(r.id),
        targetId: String(r.targetId),
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      })),
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) });
  }
};

exports.upsertSiteSetting = async (req, res) => {
  const settingName = String(req.body?.settingName || "").trim();
  const settingValue = String(req.body?.settingValue || "");
  if (!settingName) {
    return res.status(400).json({ ok: false, errorKey: "missing_setting_name" });
  }
  try {
    const [row] = await db.SiteSetting.findOrCreate({
      where: { settingName },
      defaults: { settingName, settingValue },
    });
    if (row.settingValue !== settingValue) {
      row.settingValue = settingValue;
      await row.save();
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) });
  }
};

exports.upsertRegion = async (req, res) => {
  const id = Number(req.body?.id || 0);
  const name = String(req.body?.name || "").trim();
  const slug = String(req.body?.slug || "").trim().toLowerCase();
  const sortOrder = Number(req.body?.sortOrder || 0);
  if (!name || !slug) return res.status(400).json({ ok: false, errorKey: "missing_fields" });
  try {
    if (id > 0) {
      const row = await db.Region.findByPk(id);
      if (!row) return res.status(404).json({ ok: false, errorKey: "not_found" });
      await row.update({ name, slug, sortOrder });
      return res.json({ ok: true, id: row.id });
    }
    const row = await db.Region.create({ name, slug, sortOrder });
    return res.json({ ok: true, id: row.id });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) });
  }
};

exports.deleteRegion = async (req, res) => {
  const id = Number(req.params?.id || 0);
  if (!(id > 0)) return res.status(400).json({ ok: false, errorKey: "invalid_id" });
  try {
    const chapterCount = await db.Chapter.count({ where: { regionId: id } });
    if (chapterCount > 0) return res.status(409).json({ ok: false, errorKey: "region_has_chapters" });
    await db.Region.destroy({ where: { id } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) });
  }
};

exports.createChapter = async (req, res) => {
  const regionId = Number(req.body?.regionId || 0);
  const name = String(req.body?.name || "").trim();
  const slug = String(req.body?.slug || "").trim().toLowerCase();
  const maxMembers = Number(req.body?.maxMembers || 40);
  const timezone = String(req.body?.timezone || "Asia/Ulaanbaatar").trim() || "Asia/Ulaanbaatar";
  if (!(regionId > 0) || !name || !slug) {
    return res.status(400).json({ ok: false, errorKey: "missing_fields" });
  }
  try {
    const row = await db.Chapter.create({ regionId, name, slug, maxMembers, timezone });
    return res.json({ ok: true, id: row.id });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) });
  }
};
