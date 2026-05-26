"use strict";

const {
  schemaReady,
  normalizeTypeFilter,
  listOpen,
  countOpen,
  getById,
  TYPE_LABELS_MN,
  ALLOWED_TYPES,
} = require("../lib/opportunities-public");

exports.listPublic = async (req, res) => {
  try {
    if (!(await schemaReady())) {
      return res.json({
        ok: true,
        data: { schemaReady: false, opportunities: [], total: 0, totalPages: 1, typeLabels: TYPE_LABELS_MN },
      });
    }

    const typeFilter = normalizeTypeFilter(req.query.type);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const perPage = Math.min(24, Math.max(1, parseInt(req.query.per_page, 10) || 12));
    const offset = (page - 1) * perPage;

    const [total, opportunities] = await Promise.all([
      countOpen(typeFilter),
      listOpen({ typeFilter, limit: perPage, offset }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return res.json({
      ok: true,
      data: {
        schemaReady: true,
        opportunities,
        total,
        page,
        perPage,
        totalPages,
        typeFilter,
        allowedTypes: ALLOWED_TYPES,
        typeLabels: TYPE_LABELS_MN,
      },
    });
  } catch (err) {
    console.error("opportunities list failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};

exports.getById = async (req, res) => {
  try {
    if (!(await schemaReady())) {
      return res.status(503).json({ ok: false, message: "schema_missing" });
    }

    const opp = await getById(req.params.id);
    if (!opp) {
      return res.status(404).json({ ok: false, message: "not_found" });
    }

    return res.json({ ok: true, data: { opportunity: opp, typeLabels: TYPE_LABELS_MN } });
  } catch (err) {
    console.error("opportunity get failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};
