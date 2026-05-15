"use strict";

const db = require("../../models");
const { Op } = db.Sequelize;

function accountIdFromReq(req) {
  const raw = req.user?.id;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function baseSlugFromTitle(title) {
  const t = String(title || "")
    .trim()
    .toLowerCase();
  let s = t
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (s.length < 2) {
    s = `news-${Date.now()}`;
  }
  return s.slice(0, 200);
}

async function ensureUniqueSlug(base, excludeId) {
  let slug = String(base || "news").trim().slice(0, 480) || `news-${Date.now()}`;
  let n = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = (n === 0 ? slug : `${slug}-${n}`).slice(0, 512);
    const where = { slug: candidate };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const found = await db.NewsArticle.findOne({ where });
    if (!found) return candidate;
    n += 1;
  }
}

function mergeExcerptWithSource(excerpt, sourceUrl) {
  const e = String(excerpt || "").trim();
  const u = String(sourceUrl || "").trim();
  if (!u) {
    return e || null;
  }
  const line = `Эх сурвалж: ${u}`;
  if (!e) return line;
  if (e.includes(u)) return e;
  return `${e}\n\n${line}`;
}

function splitExcerptForEditor(raw) {
  const full = String(raw || "");
  const m = full.match(/\n\nЭх сурвалж:\s*(https?:\/\/\S+)\s*$/);
  if (m && m.index !== undefined) {
    return { excerpt: full.slice(0, m.index).trim(), sourceUrl: m[1].trim() };
  }
  return { excerpt: full.trim(), sourceUrl: "" };
}

exports.listMine = async (req, res) => {
  try {
    const aid = accountIdFromReq(req);
    if (!aid) {
      return res.status(401).json({ ok: false, message: "unauthorized" });
    }
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const rows = await db.NewsArticle.findAll({
      where: { authorId: aid },
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
      limit,
      offset,
    });
    const total = await db.NewsArticle.count({ where: { authorId: aid } });
    return res.json({
      ok: true,
      data: { news: rows.map((r) => r.toJSON()), total },
    });
  } catch (err) {
    console.error("platform news list failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};

exports.getMine = async (req, res) => {
  try {
    const aid = accountIdFromReq(req);
    if (!aid) {
      return res.status(401).json({ ok: false, message: "unauthorized" });
    }
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, message: "bad_id" });
    }
    const row = await db.NewsArticle.findOne({ where: { id, authorId: aid } });
    if (!row) {
      return res.status(404).json({ ok: false, message: "not_found" });
    }
    const j = row.toJSON();
    const split = splitExcerptForEditor(j.excerpt);
    return res.json({ ok: true, data: { ...j, excerpt: split.excerpt, sourceUrl: split.sourceUrl } });
  } catch (err) {
    console.error("platform news get failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};

exports.create = async (req, res) => {
  try {
    const aid = accountIdFromReq(req);
    if (!aid) {
      return res.status(401).json({ ok: false, message: "unauthorized" });
    }
    const {
      title,
      slug: slugIn,
      excerpt,
      sourceUrl,
      body,
      image,
      status = "draft",
      category = 4,
      featured = 0,
    } = req.body || {};

    const t = String(title || "").trim();
    if (!t) {
      return res.status(400).json({ ok: false, message: "title_required" });
    }

    const html = String(body || "").trim();
    const baseSlug = String(slugIn || "").trim() || baseSlugFromTitle(t);
    const slug = await ensureUniqueSlug(baseSlug, null);

    const excerptMerged = mergeExcerptWithSource(excerpt, sourceUrl);

    const st = status === "published" ? "published" : "draft";
    const cat = Number(category);
    const feat = Number(featured) ? 1 : 0;

    const row = await db.NewsArticle.create({
      title: t.slice(0, 512),
      slug,
      excerpt: excerptMerged,
      content: html,
      body: html,
      image: image ? String(image).trim().slice(0, 512) : null,
      images: null,
      authorId: aid,
      status: st,
      featured: feat,
      category: Number.isFinite(cat) ? cat : 4,
      type: null,
      createDate: null,
    });

    return res.status(201).json({ ok: true, data: row.toJSON() });
  } catch (err) {
    console.error("platform news create failed:", err);
    if (err?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ ok: false, message: "slug_conflict" });
    }
    return res.status(500).json({ ok: false, message: "failed" });
  }
};

exports.update = async (req, res) => {
  try {
    const aid = accountIdFromReq(req);
    if (!aid) {
      return res.status(401).json({ ok: false, message: "unauthorized" });
    }
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, message: "bad_id" });
    }

    const row = await db.NewsArticle.findOne({ where: { id, authorId: aid } });
    if (!row) {
      return res.status(404).json({ ok: false, message: "not_found" });
    }

    const {
      title,
      slug: slugIn,
      excerpt,
      sourceUrl,
      body,
      image,
      status,
      category,
      featured,
    } = req.body || {};

    if (title !== undefined) {
      const t = String(title || "").trim();
      if (!t) {
        return res.status(400).json({ ok: false, message: "title_required" });
      }
      row.title = t.slice(0, 512);
    }

    if (body !== undefined) {
      const html = String(body || "").trim();
      row.content = html;
      row.body = html;
    }

    if (excerpt !== undefined || sourceUrl !== undefined) {
      const ex = excerpt !== undefined ? String(excerpt || "").trim() : splitExcerptForEditor(row.excerpt).excerpt;
      const su = sourceUrl !== undefined ? String(sourceUrl || "").trim() : splitExcerptForEditor(row.excerpt).sourceUrl;
      row.excerpt = mergeExcerptWithSource(ex, su);
    }

    if (image !== undefined) {
      row.image = image ? String(image).trim().slice(0, 512) : null;
    }

    if (status !== undefined) {
      row.status = status === "published" ? "published" : "draft";
    }

    if (category !== undefined) {
      const cat = Number(category);
      if (Number.isFinite(cat)) row.category = cat;
    }

    if (featured !== undefined) {
      row.featured = Number(featured) ? 1 : 0;
    }

    if (slugIn !== undefined) {
      const base = String(slugIn || "").trim() || baseSlugFromTitle(row.title);
      row.slug = await ensureUniqueSlug(base, row.id);
    }

    await row.save();
    return res.json({ ok: true, data: row.toJSON() });
  } catch (err) {
    console.error("platform news update failed:", err);
    if (err?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ ok: false, message: "slug_conflict" });
    }
    return res.status(500).json({ ok: false, message: "failed" });
  }
};

exports.remove = async (req, res) => {
  try {
    const aid = accountIdFromReq(req);
    if (!aid) {
      return res.status(401).json({ ok: false, message: "unauthorized" });
    }
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, message: "bad_id" });
    }
    const n = await db.NewsArticle.destroy({ where: { id, authorId: aid } });
    if (!n) {
      return res.status(404).json({ ok: false, message: "not_found" });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("platform news delete failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};
