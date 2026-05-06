"use strict";

const { Op } = require("sequelize");
const db = require("../models");

exports.list = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const meetings = await db.LegacyMeeting.findAll({
      where: {
        status: "active",
        meetingDate: { [Op.gte]: today },
      },
      order: [
        ["meetingDate", "ASC"],
        ["startTime", "ASC"],
      ],
      limit: 60,
    });
    return res.json({ ok: true, data: meetings });
  } catch (err) {
    console.error("legacy meetings list failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await db.LegacyMeeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({ ok: false, message: "Meeting not found" });
    }
    return res.json({ ok: true, data: meeting });
  } catch (err) {
    console.error("legacy meeting get failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};
