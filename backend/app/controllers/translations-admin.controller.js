"use strict";

const db = require("../models");
const {
  ENTITY_FIELDS,
  normalizeLang,
  translateRecords,
  translateWithGroq,
  upsertTranslation,
} = require("../lib/content-translations");

async function loadEntityRecords(entityType, entityId) {
  if (entityType === "trip") {
    const row = await db.BusinessTrip.findByPk(entityId);
    return row ? [row] : [];
  }
  if (entityType === "event") {
    const row = await db.BniEvent.findByPk(entityId);
    return row ? [row] : [];
  }
  if (entityType === "news") {
    const row = await db.NewsArticle.findByPk(entityId);
    return row ? [row] : [];
  }
  return [];
}

exports.autoTranslate = async (req, res) => {
  try {
    const entityType = String(req.body?.entityType || "").trim();
    const entityId = String(req.body?.entityId || "").trim();
    const targetLangsRaw = req.body?.targetLangs;
    const targetLangs = Array.isArray(targetLangsRaw)
      ? targetLangsRaw.map((l) => normalizeLang(l)).filter((l) => l !== "mn")
      : ["en", "cn", "kr", "jp"];

    if (!ENTITY_FIELDS[entityType]) {
      return res.status(400).json({ ok: false, error: "bad_entity_type" });
    }
    if (!entityId) {
      return res.status(400).json({ ok: false, error: "bad_entity_id" });
    }

    const records = await loadEntityRecords(entityType, entityId);
    if (records.length === 0) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    const written = [];
    for (const lang of targetLangs) {
      await translateRecords(records, entityType, lang, { autoFillMissing: true });
      written.push(lang);
    }

    return res.json({ ok: true, entityType, entityId, langs: written });
  } catch (err) {
    console.error("autoTranslate failed:", err);
    return res.status(500).json({ ok: false, error: "failed" });
  }
};

exports.autoTranslateBatch = async (req, res) => {
  try {
    const entityType = String(req.body?.entityType || "").trim();
    const limit = Math.min(50, Math.max(1, Number.parseInt(String(req.body?.limit || "20"), 10) || 20));
    const targetLangs = ["en"];

    if (!ENTITY_FIELDS[entityType]) {
      return res.status(400).json({ ok: false, error: "bad_entity_type" });
    }

    let rows = [];
    if (entityType === "trip") {
      rows = await db.BusinessTrip.findAll({ order: [["id", "DESC"]], limit });
    } else if (entityType === "event") {
      rows = await db.BniEvent.findAll({ order: [["id", "DESC"]], limit });
    } else if (entityType === "news") {
      rows = await db.NewsArticle.findAll({
        where: { status: "published" },
        order: [["id", "DESC"]],
        limit,
      });
    }

    for (const lang of targetLangs) {
      await translateRecords(rows, entityType, lang, { autoFillMissing: true });
    }

    return res.json({ ok: true, entityType, count: rows.length, langs: targetLangs });
  } catch (err) {
    console.error("autoTranslateBatch failed:", err);
    return res.status(500).json({ ok: false, error: "failed" });
  }
};

exports.translateText = async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    const lang = normalizeLang(req.body?.lang);
    if (!text) return res.status(400).json({ ok: false, error: "text_required" });
    if (lang === "mn") return res.json({ ok: true, text });
    const out = await translateWithGroq(text, lang);
    return res.json({ ok: true, text: out });
  } catch (err) {
    console.error("translateText failed:", err);
    return res.status(500).json({ ok: false, error: "failed" });
  }
};

exports.upsertManual = async (req, res) => {
  try {
    const entityType = String(req.body?.entityType || "").trim();
    const entityId = String(req.body?.entityId || "").trim();
    const fieldName = String(req.body?.fieldName || "").trim();
    const lang = normalizeLang(req.body?.lang);
    const value = String(req.body?.value || "").trim();

    if (!ENTITY_FIELDS[entityType]?.includes(fieldName)) {
      return res.status(400).json({ ok: false, error: "bad_field" });
    }
    if (!entityId || !value || lang === "mn") {
      return res.status(400).json({ ok: false, error: "bad_payload" });
    }

    await upsertTranslation(entityType, entityId, fieldName, lang, value, "");
    return res.json({ ok: true });
  } catch (err) {
    console.error("upsertManual failed:", err);
    return res.status(500).json({ ok: false, error: "failed" });
  }
};
