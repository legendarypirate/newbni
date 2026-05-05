"use strict";

const db = require("../models");

exports.root = (_req, res) => {
  res.json({ message: "newbni-backend (BUSY schema)", ok: true });
};

exports.healthCheck = (_req, res) => {
  const port = Number(process.env.PORT || 3001);
  res.json({ ok: true, service: "newbni-backend", port });
};

exports.dbHealthCheck = async (_req, res) => {
  try {
    await db.sequelize.authenticate();
    res.json({ ok: true, database: true });
  } catch (err) {
    res.status(500).json({
      ok: false,
      database: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
