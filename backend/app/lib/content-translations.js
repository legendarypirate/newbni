"use strict";

const crypto = require("crypto");
const db = require("../models");
const { readCookieValueFromHeader } = require("../utils/cookies");

const ALLOWED_LANGS = new Set(["mn", "en", "cn", "kr", "jp"]);
const SOURCE_LANG = "mn";

const LANG_LABELS = {
  en: "English",
  cn: "Simplified Chinese",
  kr: "Korean",
  jp: "Japanese",
};

const ENTITY_FIELDS = {
  trip: ["destination", "focus", "description", "seatsLabel", "statusLabel", "shortDescription"],
  event: ["title", "location", "summary"],
  news: ["title", "excerpt", "body", "content"],
  investment: ["title", "excerpt", "description", "sector", "statusLabel", "location"],
};

function normalizeLang(raw) {
  const code = String(raw || "")
    .trim()
    .toLowerCase();
  if (code === "zh") return "cn";
  if (code === "ko") return "kr";
  if (code === "ja") return "jp";
  return ALLOWED_LANGS.has(code) ? code : SOURCE_LANG;
}

function resolveLangFromReq(req) {
  const fromQuery = req.query?.lang;
  const fromHeader = req.headers["x-bni-lang"];
  const fromCookie = readCookieValueFromHeader(req.headers.cookie, "bni_lang");
  return normalizeLang(fromQuery || fromHeader || fromCookie || SOURCE_LANG);
}

function hashSource(text) {
  return crypto.createHash("sha256").update(String(text || ""), "utf8").digest("hex").slice(0, 32);
}

function pickField(record, fieldName) {
  if (!record || typeof record !== "object") return "";
  if (fieldName === "shortDescription") {
    const extras = record.extrasJson ?? record.extras_json;
    if (extras && typeof extras === "object" && !Array.isArray(extras)) {
      return String(extras.short_description ?? extras.shortDescription ?? "").trim();
    }
    return "";
  }
  if (fieldName === "summary") {
    const env = record.curriculumOverrideJson ?? record.curriculum_override_json;
    if (env && typeof env === "object" && !Array.isArray(env)) {
      return String(env.summary ?? env.description ?? "").trim();
    }
    return "";
  }
  const v = record[fieldName];
  return v == null ? "" : String(v).trim();
}

function setField(record, fieldName, value) {
  if (!record || typeof record !== "object") return;
  if (fieldName === "shortDescription") {
    const extras = record.extrasJson ?? record.extras_json;
    const base = extras && typeof extras === "object" && !Array.isArray(extras) ? { ...extras } : {};
    base.short_description = value;
    if ("extrasJson" in record) record.extrasJson = base;
    else record.extras_json = base;
    return;
  }
  if (fieldName === "summary") {
    const env = record.curriculumOverrideJson ?? record.curriculum_override_json;
    const base = env && typeof env === "object" && !Array.isArray(env) ? { ...env } : {};
    base.summary = value;
    if ("curriculumOverrideJson" in record) record.curriculumOverrideJson = base;
    else record.curriculum_override_json = base;
    return;
  }
  record[fieldName] = value;
}

async function loadTranslationMap(entityType, entityIds, lang) {
  const map = new Map();
  if (lang === SOURCE_LANG) return map;
  const ids = [...new Set(entityIds.map((id) => String(id)).filter(Boolean))];
  if (ids.length === 0) return map;

  try {
    const rows = await db.ContentTranslation.findAll({
      where: {
        entityType,
        entityId: ids,
        lang,
      },
    });
    for (const row of rows) {
      const key = `${row.entityId}::${row.fieldName}`;
      map.set(key, row.value);
    }
  } catch (err) {
    if (String(err?.message || "").includes("does not exist")) {
      return map;
    }
    console.error("loadTranslationMap failed:", err);
  }
  return map;
}

async function upsertTranslation(entityType, entityId, fieldName, lang, value, sourceText) {
  if (!value || lang === SOURCE_LANG) return;
  try {
    await db.ContentTranslation.upsert({
      entityType,
      entityId: String(entityId),
      fieldName,
      lang,
      value,
      sourceHash: hashSource(sourceText),
      updatedAt: new Date(),
    });
  } catch (err) {
    console.error("upsertTranslation failed:", err);
  }
}

async function translateWithGroq(text, targetLang) {
  const apiKey = String(process.env.GROQ_API_KEY || "").trim();
  const trimmed = String(text || "").trim();
  if (!trimmed || !apiKey || targetLang === SOURCE_LANG) return trimmed;

  const targetLabel = LANG_LABELS[targetLang] || targetLang;
  const model = String(process.env.GROQ_MODEL || "llama-3.1-8b-instant").trim();

  const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: Math.min(2000, Math.max(120, trimmed.length * 2)),
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator for a Mongolian B2B travel/events platform. Translate faithfully; keep names, numbers, URLs, and prices unchanged. Output only the translation, no quotes or commentary.",
        },
        {
          role: "user",
          content: `Translate from Mongolian to ${targetLabel}:\n\n${trimmed}`,
        },
      ],
    }),
  });

  const data = await upstream.json().catch(() => null);
  const reply =
    data?.choices?.[0]?.message?.content != null ? String(data.choices[0].message.content).trim() : "";
  return reply || trimmed;
}

async function ensureFieldTranslation(entityType, entityId, fieldName, lang, sourceText) {
  const src = String(sourceText || "").trim();
  if (!src || lang === SOURCE_LANG) return src;

  const existing = await db.ContentTranslation.findOne({
    where: { entityType, entityId: String(entityId), fieldName, lang },
  }).catch(() => null);

  const srcHash = hashSource(src);
  if (existing && existing.sourceHash === srcHash && String(existing.value || "").trim()) {
    return String(existing.value).trim();
  }

  const translated = await translateWithGroq(src, lang);
  if (translated && translated !== src) {
    await upsertTranslation(entityType, entityId, fieldName, lang, translated, src);
  }
  return translated || src;
}

function applyMapToRecord(record, entityType, entityId, lang, map) {
  if (lang === SOURCE_LANG) return record;
  const fields = ENTITY_FIELDS[entityType] || [];
  const id = String(entityId);
  for (const fieldName of fields) {
    const translated = map.get(`${id}::${fieldName}`);
    if (translated) setField(record, fieldName, translated);
  }
  return record;
}

async function translateRecords(records, entityType, lang, options = {}) {
  const { idField = "id", autoFillMissing = false } = options;
  if (!Array.isArray(records) || records.length === 0 || lang === SOURCE_LANG) {
    return records;
  }

  const plain = records.map((r) => (typeof r.toJSON === "function" ? r.toJSON() : { ...r }));
  const ids = plain.map((r) => r[idField]);
  let map = await loadTranslationMap(entityType, ids, lang);

  if (autoFillMissing && process.env.GROQ_API_KEY) {
    const fields = ENTITY_FIELDS[entityType] || [];
    for (const row of plain) {
      const eid = String(row[idField]);
      for (const fieldName of fields) {
        const key = `${eid}::${fieldName}`;
        if (map.has(key)) continue;
        const src = pickField(row, fieldName);
        if (!src) continue;
        const translated = await ensureFieldTranslation(entityType, eid, fieldName, lang, src);
        if (translated) {
          map.set(key, translated);
        }
      }
    }
  }

  return plain.map((row) => applyMapToRecord(row, entityType, row[idField], lang, map));
}

async function translateOne(record, entityType, lang, options = {}) {
  const { idField = "id", autoFillMissing = true } = options;
  if (!record || lang === SOURCE_LANG) {
    return typeof record?.toJSON === "function" ? record.toJSON() : record;
  }
  const [out] = await translateRecords(
    [typeof record.toJSON === "function" ? record : record],
    entityType,
    lang,
    { idField, autoFillMissing },
  );
  return out;
}

module.exports = {
  ALLOWED_LANGS,
  SOURCE_LANG,
  ENTITY_FIELDS,
  normalizeLang,
  resolveLangFromReq,
  loadTranslationMap,
  translateRecords,
  translateOne,
  ensureFieldTranslation,
  translateWithGroq,
  upsertTranslation,
};
