"use strict";

const db = require("../models");

const TYPE_LABELS_MN = {
  investment: "Хөрөнгө оруулалт",
  partnership: "Түншлэл",
  collaboration: "Хамтын ажиллагаа",
  other: "Бусад",
};

const ALLOWED_TYPES = ["all", "investment", "partnership", "collaboration", "other"];

async function schemaReady() {
  try {
    await db.BusinessOpportunity.findOne({ attributes: ["id"], raw: true });
    return true;
  } catch {
    return false;
  }
}

function normalizeTypeFilter(raw) {
  const t = String(raw || "all").trim().toLowerCase();
  return ALLOWED_TYPES.includes(t) ? t : "all";
}

async function resolveContextLabel(contextType, contextId) {
  const type = String(contextType || "none").trim().toLowerCase();
  const id = contextId != null ? Number(contextId) : NaN;
  if (!Number.isFinite(id) || id < 1 || type === "none" || !type) return "";

  if (type === "meeting") {
    const row = await db.LegacyMeeting.findByPk(id, {
      attributes: ["title", "meetingDate"],
      raw: true,
    });
    if (!row) return "";
    const title = row.title || "";
    const date = row.meetingDate ?? row.meeting_date ?? "";
    return `Уулзалт: ${title}${date ? ` (${date})` : ""}`;
  }

  if (type === "trip") {
    const row = await db.BusinessTrip.findByPk(id, {
      attributes: ["destination", "startDate"],
      raw: true,
    });
    if (!row) return "";
    const dest = row.destination || "";
    const date = row.startDate ?? row.start_date ?? "";
    return `Аялал: ${dest}${date ? ` (${date})` : ""}`;
  }

  if (type === "event") {
    const row = await db.BniEvent.findByPk(id, {
      attributes: ["title", "startsAt"],
      raw: true,
    });
    if (!row) return "";
    const title = row.title || "";
    const date = row.startsAt ?? row.starts_at ?? "";
    return `Хурал: ${title}${date ? ` (${date})` : ""}`;
  }

  return "";
}

function mapListRow(row) {
  const created = row.createdAt ?? row.created_at;
  return {
    id: String(row.id),
    title: row.title,
    summary: row.summary,
    opportunityType: row.opportunityType ?? row.opportunity_type,
    contextType: row.contextType ?? row.context_type,
    contextId: row.contextId ?? row.context_id ?? null,
    status: row.status,
    authorAccountId: String(row.authorAccountId ?? row.author_account_id),
    authorName: row.authorName ?? row.author_name ?? "",
    createdAt: created instanceof Date ? created.toISOString() : String(created || ""),
  };
}

async function listOpen({ typeFilter = "all", limit = 12, offset = 0 }) {
  const tf = normalizeTypeFilter(typeFilter);
  const where = { status: "open" };
  if (tf !== "all") where.opportunityType = tf;

  const rows = await db.sequelize.query(
    `SELECT o.id, o.title, o.summary, o.opportunity_type AS "opportunityType",
            o.context_type AS "contextType", o.context_id AS "contextId", o.status,
            o.author_account_id AS "authorAccountId", o.created_at AS "createdAt",
            COALESCE(NULLIF(TRIM(p.display_name), ''), NULLIF(TRIM(a.email), ''), '') AS "authorName"
     FROM bni_business_opportunities o
     INNER JOIN bni_platform_accounts a ON a.id = o.author_account_id
     LEFT JOIN bni_platform_profiles p ON p.account_id = o.author_account_id
     WHERE o.status = 'open'
     ${tf !== "all" ? "AND o.opportunity_type = :typeFilter" : ""}
     ORDER BY o.created_at DESC
     LIMIT :limit OFFSET :offset`,
    {
      replacements: { typeFilter: tf, limit, offset },
      type: db.Sequelize.QueryTypes.SELECT,
    },
  );

  const items = [];
  for (const row of rows) {
    const mapped = mapListRow(row);
    mapped.contextLabel = await resolveContextLabel(mapped.contextType, mapped.contextId);
    items.push(mapped);
  }
  return items;
}

async function countOpen(typeFilter = "all") {
  const tf = normalizeTypeFilter(typeFilter);
  const where = { status: "open" };
  if (tf !== "all") where.opportunityType = tf;
  return db.BusinessOpportunity.count({ where });
}

async function getById(id) {
  const num = Number(id);
  if (!Number.isFinite(num) || num < 1) return null;

  const rows = await db.sequelize.query(
    `SELECT o.id, o.title, o.summary, o.body, o.opportunity_type AS "opportunityType",
            o.context_type AS "contextType", o.context_id AS "contextId", o.status,
            o.author_account_id AS "authorAccountId", o.created_at AS "createdAt",
            COALESCE(NULLIF(TRIM(p.display_name), ''), NULLIF(TRIM(a.email), ''), '') AS "authorName",
            a.email AS "authorEmail"
     FROM bni_business_opportunities o
     INNER JOIN bni_platform_accounts a ON a.id = o.author_account_id
     LEFT JOIN bni_platform_profiles p ON p.account_id = o.author_account_id
     WHERE o.id = :id`,
    { replacements: { id: num }, type: db.Sequelize.QueryTypes.SELECT },
  );

  const row = rows[0];
  if (!row) return null;

  const mapped = {
    ...mapListRow(row),
    body: row.body ?? null,
    authorEmail: row.authorEmail ?? row.author_email ?? "",
  };
  mapped.contextLabel = await resolveContextLabel(mapped.contextType, mapped.contextId);
  return mapped;
}

module.exports = {
  TYPE_LABELS_MN,
  ALLOWED_TYPES,
  schemaReady,
  normalizeTypeFilter,
  listOpen,
  countOpen,
  getById,
};
