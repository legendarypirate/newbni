"use strict";

const { Op } = require("sequelize");
const db = require("../models");

exports.getHome = async (_req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEndExclusive = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      tripTotal,
      tripActive,
      eventTotal,
      eventActive,
      registrationTotal,
      registrationNew,
      revenueRows,
      recentOrders,
      businessTrips,
      coreEvents,
      latestNews,
      featuredMembers,
      partners,
    ] = await Promise.all([
      db.BusinessTrip.count(),
      db.BusinessTrip.count({ where: { startDate: { [Op.gte]: now } } }),
      db.BniEvent.count(),
      db.BniEvent.count({ where: { endsAt: { [Op.gte]: now } } }),
      db.PaymentOrder.count({ where: { status: { [Op.in]: ["paid", "success"] } } }),
      db.sequelize
        .query(
          `SELECT COUNT(*)::int AS c
           FROM payment_orders
           WHERE created_at >= :from_ts`,
          {
            replacements: { from_ts: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
            type: db.Sequelize.QueryTypes.SELECT,
          },
        )
        .then((rows) => Number(rows?.[0]?.c || 0)),
      db.sequelize.query(
        `SELECT COALESCE(SUM(amount_mnt), 0)::numeric AS revenue
         FROM payment_orders
         WHERE status IN ('paid', 'success')
           AND created_at >= :month_start
           AND created_at < :month_end`,
        {
          replacements: { month_start: monthStart, month_end: monthEndExclusive },
          type: db.Sequelize.QueryTypes.SELECT,
        },
      ),
      db.sequelize.query(
        `SELECT order_ref AS "orderRef", created_at AS "createdAt"
         FROM payment_orders
         ORDER BY created_at DESC
         LIMIT 3`,
        {
          type: db.Sequelize.QueryTypes.SELECT,
        },
      ),
      db.BusinessTrip.findAll({
        where: { statusLabel: "Нийтлэгдсэн" },
        limit: 3,
        order: [["startDate", "ASC"], ["id", "ASC"]],
        raw: true,
      }),
      db.BniEvent.findAll({
        where: { endsAt: { [Op.gte]: now } },
        limit: 6,
        order: [["startsAt", "ASC"], ["id", "ASC"]],
        attributes: ["id", "title", "startsAt", "endsAt", "location"],
        raw: true,
      }),
      db.sequelize.query(
        `SELECT
           id,
           title,
           image,
           slug,
           excerpt,
           content,
           body,
           created_at AS "createdAt"
         FROM news
         WHERE status = 'published'
         ORDER BY created_at DESC, id DESC
         LIMIT 6`,
        {
          type: db.Sequelize.QueryTypes.SELECT,
        },
      ),
      db.LegacyMember.findAll({
        where: { featured: 1, status: "active" },
        limit: 12,
        raw: true,
      }),
      db.PlatformProfile.findAll({
        where: { companyName: { [Op.ne]: null } },
        attributes: ["accountId", "companyName", "photoUrl"],
        limit: 20,
        order: [["updatedAt", "DESC"]],
        raw: true,
      }),
    ]);

    return res.json({
      ok: true,
      data: {
        stats: {
          tripTotal,
          tripActive,
          eventTotal,
          eventActive,
          registrationTotal,
          registrationNew,
          revenueMonth: Number(revenueRows?.[0]?.revenue || 0),
        },
        heroTrip: businessTrips[0] || null,
        coreEvents: coreEvents.map((e) => ({ ...e, id: String(e.id), bannerImage: e.bannerImage || null })),
        businessTrips,
        latestNews,
        featuredMembers,
        partners: partners
          .filter((p) => String(p.companyName || "").trim() !== "")
          .map((p) => ({
            name: String(p.companyName || "").trim(),
            logo: p.photoUrl || "",
            href: `/member/${p.accountId}`,
          })),
        recentOrders: recentOrders.map((o) => ({
          orderRef: o.orderRef,
          createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
        })),
      },
    });
  } catch (err) {
    console.error("home payload failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};

