"use strict";

const db = require("../models");

exports.list = async (req, res) => {
  try {
    const orders = await db.PaymentOrder.findAll({
      order: [["created_at", "DESC"]],
      limit: 80,
    });
    return res.json({ ok: true, data: orders });
  } catch (err) {
    console.error("payments list failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};
