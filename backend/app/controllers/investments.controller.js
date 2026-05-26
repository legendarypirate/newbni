"use strict";

const db = require("../models");
const { translateRecords } = require("../lib/content-translations");

function clampPercent(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, Math.round(v)));
}

function toPublicRow(row) {
  const publishedAt = row.publishedAt ?? row.published_at;
  const iso =
    publishedAt instanceof Date
      ? publishedAt.toISOString()
      : publishedAt
        ? String(publishedAt)
        : null;
  return {
    id: row.id,
    title: row.title,
    sector: row.sector ?? null,
    excerpt: row.excerpt ?? null,
    coverImageUrl: row.coverImageUrl ?? row.cover_image_url ?? null,
    targetMnt: row.targetMnt != null ? Number(row.targetMnt) : row.target_mnt != null ? Number(row.target_mnt) : null,
    raisedPercent: clampPercent(row.raisedPercent ?? row.raised_percent),
    startDate: iso,
    statusLabel: row.statusLabel ?? row.status_label ?? null,
    stage: row.stage ?? null,
    location: row.location ?? null,
  };
}

exports.listPublished = async (req, res) => {
  try {
    const rows = await db.InvestmentProject.findAll({
      where: { status: "published" },
      order: [
        ["isFeatured", "DESC"],
        ["publishedAt", "DESC"],
        ["id", "DESC"],
      ],
      raw: true,
    });

    const lang = req.bniLang || "mn";
    const translated = await translateRecords(rows, "investment", lang);
    const projects = translated.map(toPublicRow);
    const featuredRow = rows.find((r) => Number(r.is_featured ?? r.isFeatured) === 1);
    const featuredProject =
      (featuredRow ? projects.find((p) => p.id === featuredRow.id) : null) ?? projects[0] ?? null;

    return res.json({
      ok: true,
      data: {
        projects,
        featuredProject,
      },
    });
  } catch (err) {
    console.error("investments list failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};
