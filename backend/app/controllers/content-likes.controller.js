"use strict";

const {
  normalizeTargetType,
  normalizeTargetIds,
  fetchLikeCounts,
  fetchLikedTargetIds,
  toggleLike,
} = require("../lib/content-likes");

exports.toggle = async (req, res) => {
  try {
    const accountId = req.platformUser?.id;
    if (!accountId) {
      return res.status(401).json({ ok: false, message: "login_required" });
    }

    const targetType = normalizeTargetType(req.body?.targetType ?? req.body?.target_type);
    const targetId = String(req.body?.targetId ?? req.body?.target_id ?? "").trim();
    if (!targetType || !targetId) {
      return res.status(400).json({ ok: false, message: "invalid" });
    }

    const data = await toggleLike(accountId, targetType, targetId);
    return res.json({ ok: true, data });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error("like toggle failed:", err);
    return res.status(status).json({ ok: false, message: err.message || "failed" });
  }
};

exports.batch = async (req, res) => {
  try {
    const targetType = normalizeTargetType(req.query?.target_type ?? req.query?.targetType);
    const ids = normalizeTargetIds(req.query?.ids);
    if (!targetType || ids.length === 0) {
      return res.status(400).json({ ok: false, message: "invalid" });
    }

    const accountId = req.platformUser?.id ?? null;
    const [counts, likedSet] = await Promise.all([
      fetchLikeCounts(targetType, ids),
      fetchLikedTargetIds(accountId, targetType, ids),
    ]);

    const items = ids.map((id) => ({
      targetId: id,
      likeCount: counts.get(id) ?? 0,
      likedByMe: likedSet.has(id),
    }));

    return res.json({ ok: true, data: { items } });
  } catch (err) {
    console.error("like batch failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};
