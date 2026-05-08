"use strict";

const db = require("../models");

/**
 * Looks up the public byline data for a set of `news.author_id` values.
 * Returns a `Map<authorId, { accountId, displayName, photoUrl, memberPhotoUrl, companyName, bio }>`.
 *
 * Uses the `bni_platform_profiles` table directly (no Sequelize associations
 * defined yet — the news author is logically the same as the platform account
 * id, but the FK is informal).
 */
async function loadAuthorsByIds(authorIds) {
  const ids = [...new Set(authorIds.filter((v) => Number.isFinite(Number(v))))].map(Number);
  if (ids.length === 0) return new Map();
  const profiles = await db.PlatformProfile.findAll({
    where: { accountId: ids },
    raw: true,
  });
  const out = new Map();
  for (const p of profiles) {
    const businessJson = p.businessJson && typeof p.businessJson === "object" ? p.businessJson : {};
    const memberPhotoUrl = String(businessJson.member_photo_url ?? "").trim() || null;
    out.set(Number(p.accountId), {
      accountId: Number(p.accountId),
      displayName: p.displayName ?? "",
      photoUrl: p.photoUrl ?? null,
      memberPhotoUrl,
      companyName: p.companyName ?? null,
      bio: p.bio ?? null,
    });
  }
  return out;
}

exports.list = async (req, res) => {
  try {
    const { status = "published", limit = 10, offset = 0, authorId } = req.query;
    const where = {};
    if (status) where.status = status;
    const authorNum = authorId !== undefined && authorId !== "" ? Number(authorId) : NaN;
    if (Number.isFinite(authorNum) && authorNum > 0) {
      where.authorId = authorNum;
    }

    const news = await db.NewsArticle.findAll({
      where,
      order: [["createdAt", "DESC"], ["id", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const total = await db.NewsArticle.count({ where });

    const authors = await loadAuthorsByIds(news.map((n) => n.authorId));
    const enriched = news.map((n) => ({
      ...n.toJSON(),
      author: authors.get(Number(n.authorId)) || null,
    }));

    return res.json({ ok: true, data: { news: enriched, total } });
  } catch (err) {
    console.error("news list failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await db.NewsArticle.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { id: isNaN(id) ? -1 : id },
          { slug: id }
        ]
      }
    });
    if (!article) {
      return res.status(404).json({ ok: false, message: "Article not found" });
    }
    const authors = await loadAuthorsByIds([article.authorId]);
    const data = {
      ...article.toJSON(),
      author: authors.get(Number(article.authorId)) || null,
    };
    return res.json({ ok: true, data });
  } catch (err) {
    console.error("news get failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};
