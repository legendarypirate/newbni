"use strict";

const db = require("../models");

exports.getSettingByName = async (req, res) => {
  const name = String(req.params.name || "").trim();
  if (!name) {
    return res.status(400).json({ ok: false, error: "bad_name" });
  }

  try {
    const row = await db.SiteSetting.findOne({
      where: { settingName: name },
      attributes: ["settingValue"],
      raw: true,
    });
    return res.json({ ok: true, settingValue: String(row?.settingValue || "") });
  } catch (err) {
    console.error("getSettingByName failed:", err);
    return res.status(500).json({ ok: false, error: "failed" });
  }
};

