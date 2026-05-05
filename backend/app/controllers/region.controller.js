"use strict";

const db = require("../models");

exports.list = async (_req, res) => {
  try {
    const rows = await db.Region.findAll({
      limit: 100,
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
      ],
      attributes: ["id", "name", "slug", "sortOrder"],
    });
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
