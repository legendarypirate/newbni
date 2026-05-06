"use strict";

const db = require("../models");

exports.list = async (req, res) => {
  try {
    const { status = "published", limit = 10, offset = 0 } = req.query;
    const where = {};
    if (status) where.status = status;

    const news = await db.NewsArticle.findAll({
      where,
      order: [["createdAt", "DESC"], ["id", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const total = await db.NewsArticle.count({ where });

    return res.json({ ok: true, data: { news, total } });
  } catch (err) {
    console.error("news list failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await db.NewsArticle.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { id: isNaN(id) ? -1 : id },
          { slug: id }
        ]
      }
    });
    if (!article) {
      return res.status(404).json({ ok: false, message: "Article not found" });
    }
    return res.json({ ok: true, data: article });
  } catch (err) {
    console.error("news get failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};
