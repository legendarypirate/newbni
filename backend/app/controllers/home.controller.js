"use strict";

const { Op } = require("sequelize");
const db = require("../models");
const { translateRecords } = require("../lib/content-translations");
const { attachLikeMeta, sortByLikeCountDesc } = require("../lib/content-likes");
const { tripStatusForPublic } = require("../lib/content-approval");

async function safe(label, fn, fallback) {
  try {
    return await fn();
  } catch (err) {
    console.error(`home ${label} failed:`, err);
    return fallback;
  }
}

function sortTripsForHome(trips) {
  const copy = [...trips];
  copy.sort((a, b) => {
    const featuredDiff = (b.isFeatured ?? 0) - (a.isFeatured ?? 0);
    if (featuredDiff !== 0) return featuredDiff;
    const likeDiff = (b.likeCount ?? 0) - (a.likeCount ?? 0);
    if (likeDiff !== 0) return likeDiff;
    const da = new Date(a.startDate).getTime();
    const db = new Date(b.startDate).getTime();
    if (da !== db) return da - db;
    return Number(a.id) - Number(b.id);
  });
  return copy;
}

exports.getHome = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEndExclusive = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lang = req.bniLang || "mn";
    const accountId = req.platformUser?.id ?? null;
    const publicStatus = tripStatusForPublic();

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
      safe("tripTotal", () => db.BusinessTrip.count(), 0),
      safe("tripActive", () => db.BusinessTrip.count({ where: { startDate: { [Op.gte]: now } } }), 0),
      safe("eventTotal", () => db.BniEvent.count(), 0),
      safe("eventActive", () => db.BniEvent.count({ where: { endsAt: { [Op.gte]: now } } }), 0),
      safe(
        "registrationTotal",
        () => db.PaymentOrder.count({ where: { status: { [Op.in]: ["paid", "success"] } } }),
        0,
      ),
      safe(
        "registrationNew",
        () =>
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
        0,
      ),
      safe(
        "revenue",
        () =>
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
        [{ revenue: 0 }],
      ),
      safe(
        "recentOrders",
        () =>
          db.sequelize.query(
            `SELECT order_ref AS "orderRef", created_at AS "createdAt"
             FROM payment_orders
             ORDER BY created_at DESC
             LIMIT 3`,
            { type: db.Sequelize.QueryTypes.SELECT },
          ),
        [],
      ),
      safe(
        "businessTrips",
        () =>
          db.BusinessTrip.findAll({
            where: { statusLabel: publicStatus },
            limit: 40,
            order: [
              ["isFeatured", "DESC"],
              ["startDate", "ASC"],
              ["id", "ASC"],
            ],
            raw: true,
          }),
        [],
      ),
      safe(
        "coreEvents",
        () =>
          db.BniEvent.findAll({
            where: { endsAt: { [Op.gte]: now } },
            limit: 40,
            order: [["startsAt", "ASC"], ["id", "ASC"]],
            attributes: ["id", "title", "startsAt", "endsAt", "location", "bannerImage"],
            raw: true,
          }),
        [],
      ),
      safe(
        "latestNews",
        () =>
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
            { type: db.Sequelize.QueryTypes.SELECT },
          ),
        [],
      ),
      safe(
        "featuredMembers",
        () =>
          db.LegacyMember.findAll({
            where: { featured: 1, status: "active" },
            limit: 12,
            raw: true,
          }),
        [],
      ),
      safe(
        "partners",
        () =>
          db.PlatformProfile.findAll({
            where: { companyName: { [Op.ne]: null } },
            attributes: ["accountId", "companyName", "photoUrl"],
            limit: 20,
            order: [["updatedAt", "DESC"]],
            raw: true,
          }),
        [],
      ),
    ]);

    const [tripsTranslated, eventsTranslated, newsOut] = await Promise.all([
      safe("translateTrips", () => translateRecords(businessTrips, "trip", lang), businessTrips),
      safe(
        "translateEvents",
        () =>
          translateRecords(
            coreEvents.map((e) => ({ ...e, id: String(e.id), bannerImage: e.bannerImage || null })),
            "event",
            lang,
          ),
        [],
      ),
      safe("translateNews", () => translateRecords(latestNews, "news", lang), latestNews),
    ]);

    let tripsWithLikes = tripsTranslated;
    let eventsWithLikes = eventsTranslated;
    try {
      [tripsWithLikes, eventsWithLikes] = await Promise.all([
        attachLikeMeta(tripsTranslated, "trip", accountId),
        attachLikeMeta(eventsTranslated, "event", accountId),
      ]);
    } catch (likeErr) {
      console.error("home attachLikeMeta failed:", likeErr);
    }

    const tripsOut = sortTripsForHome(tripsWithLikes).slice(0, 3);

    const eventsOut = sortByLikeCountDesc(eventsWithLikes, (a, b) => {
      const da = new Date(a.startsAt).getTime();
      const db = new Date(b.startsAt).getTime();
      if (da !== db) return da - db;
      return String(a.id).localeCompare(String(b.id));
    }).slice(0, 6);

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
        heroTrip: tripsOut[0] || null,
        coreEvents: eventsOut,
        businessTrips: tripsOut,
        latestNews: newsOut,
        featuredMembers,
        partners: partners
          .filter((p) => String(p.companyName || "").trim() !== "")
          .map((p) => ({
            name: String(p.companyName || "").trim(),
            logo: p.photoUrl || "",
            href: `/member/${String(p.accountId)}`,
          })),
        recentOrders: (recentOrders || []).map((o) => ({
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
