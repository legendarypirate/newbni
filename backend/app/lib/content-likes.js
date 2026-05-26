"use strict";

const { Op } = require("sequelize");
const db = require("../models");

const ALLOWED_TYPES = new Set(["trip", "event"]);

function normalizeTargetType(raw) {
  const t = String(raw || "").trim().toLowerCase();
  return ALLOWED_TYPES.has(t) ? t : null;
}

function normalizeTargetIds(raw) {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((v) => String(v).trim()).filter(Boolean))];
  }
  const text = String(raw || "").trim();
  if (!text) return [];
  return [...new Set(text.split(",").map((s) => s.trim()).filter(Boolean))];
}

async function fetchLikeCounts(targetType, targetIds) {
  const ids = normalizeTargetIds(targetIds);
  const map = new Map();
  if (!ids.length) return map;

  const rows = await db.sequelize.query(
    `SELECT target_id AS "targetId", COUNT(*)::int AS cnt
     FROM content_likes
     WHERE target_type = :targetType AND target_id IN (:ids)
     GROUP BY target_id`,
    {
      replacements: { targetType, ids },
      type: db.Sequelize.QueryTypes.SELECT,
    },
  );

  for (const row of rows) {
    map.set(String(row.targetId), Number(row.cnt) || 0);
  }
  return map;
}

async function fetchLikedTargetIds(accountId, targetType, targetIds) {
  const ids = normalizeTargetIds(targetIds);
  const liked = new Set();
  if (!accountId || !ids.length) return liked;

  const rows = await db.ContentLike.findAll({
    where: {
      accountId,
      targetType,
      targetId: { [Op.in]: ids },
    },
    attributes: ["targetId"],
    raw: true,
  });

  for (const row of rows) {
    liked.add(String(row.targetId ?? row.target_id));
  }
  return liked;
}

function rowId(row) {
  if (row == null || typeof row !== "object") return "";
  const id = row.id;
  return id == null ? "" : String(id);
}

/** Attach `likeCount` and `likedByMe` to plain objects. */
async function attachLikeMeta(rows, targetType, accountId, idField = "id") {
  const list = Array.isArray(rows) ? rows : [];
  const ids = list.map((r) => String(r[idField] ?? r.id ?? "")).filter(Boolean);
  const [counts, likedSet] = await Promise.all([
    fetchLikeCounts(targetType, ids),
    fetchLikedTargetIds(accountId, targetType, ids),
  ]);

  return list.map((row) => {
    const id = String(row[idField] ?? row.id);
    return {
      ...row,
      likeCount: counts.get(id) ?? 0,
      likedByMe: likedSet.has(id),
    };
  });
}

function sortByLikeCountDesc(rows, tieBreaker) {
  const copy = [...rows];
  copy.sort((a, b) => {
    const diff = (b.likeCount ?? 0) - (a.likeCount ?? 0);
    if (diff !== 0) return diff;
    return tieBreaker(a, b);
  });
  return copy;
}

async function countLikesForTarget(targetType, targetId) {
  return db.ContentLike.count({
    where: { targetType, targetId: String(targetId) },
  });
}

async function assertPublicTarget(targetType, targetId) {
  if (targetType === "trip") {
    const tripId = parseInt(targetId, 10);
    if (!Number.isFinite(tripId) || tripId <= 0) {
      const err = new Error("invalid_trip");
      err.status = 400;
      throw err;
    }
    const trip = await db.BusinessTrip.findByPk(tripId, {
      attributes: ["id", "statusLabel"],
      raw: true,
    });
    if (!trip || trip.statusLabel !== "Нийтлэгдсэн") {
      const err = new Error("not_found");
      err.status = 404;
      throw err;
    }
    return;
  }

  const event = await db.BniEvent.findByPk(targetId, {
    attributes: ["id", "curriculumOverrideJson"],
    raw: true,
  });
  if (!event) {
    const err = new Error("not_found");
    err.status = 404;
    throw err;
  }

  const { EVENT_STATUS, readEventApprovalStatus } = require("./content-approval");
  const env = event.curriculumOverrideJson;
  if (readEventApprovalStatus(env) === EVENT_STATUS.PUBLISHED) return;

  const form = await db.TripRegistrationForm.findOne({
    where: { eventId: event.id, isPublished: true },
    attributes: ["id"],
    raw: true,
  });
  if (!form) {
    const err = new Error("not_found");
    err.status = 404;
    throw err;
  }
}

async function toggleLike(accountId, targetType, targetId) {
  const type = normalizeTargetType(targetType);
  const id = String(targetId ?? "").trim();
  if (!type || !id) {
    const err = new Error("invalid");
    err.status = 400;
    throw err;
  }

  await assertPublicTarget(type, id);

  const existing = await db.ContentLike.findOne({
    where: { accountId, targetType: type, targetId: id },
  });

  if (existing) {
    await existing.destroy();
    const likeCount = await countLikesForTarget(type, id);
    return { liked: false, likeCount };
  }

  await db.ContentLike.create({
    accountId,
    targetType: type,
    targetId: id,
  });
  const likeCount = await countLikesForTarget(type, id);
  return { liked: true, likeCount };
}

module.exports = {
  ALLOWED_TYPES,
  normalizeTargetType,
  normalizeTargetIds,
  fetchLikeCounts,
  fetchLikedTargetIds,
  attachLikeMeta,
  sortByLikeCountDesc,
  toggleLike,
  rowId,
};
