"use strict";

const { Op } = require("sequelize");
const db = require("../models");

/** Mirrors busybni admin dashboard aggregates — same PostgreSQL tables as Prisma */
function growthHint(current, previous, sublabel) {
  if (previous <= 0) {
    if (current <= 0) return { pctLabel: "0%", tone: "neutral", sublabel };
    return { pctLabel: "Шинэ", tone: "up", sublabel };
  }
  const raw = Math.round(((current - previous) / previous) * 100);
  if (raw === 0) return { pctLabel: "0%", tone: "neutral", sublabel };
  return {
    pctLabel: `${Math.abs(raw)}%`,
    tone: raw > 0 ? "up" : "down",
    sublabel,
  };
}

exports.dashboardStats = async (_req, res) => {
  try {
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const d30Ahead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      eventsLast30,
      eventsPrev30,
      upcomingNext30d,
      meetingRegsTotal,
      tripResponsesTotal,
      meetingRegsLast30,
      meetingRegsPrev30,
      tripRegsLast30,
      tripRegsPrev30,
      attendancePresent,
      attendanceTotal,
      paidOrdersSum,
      tripPaidSum,
      revenueLast30,
      revenuePrev30,
      pendingTripReviews,
      pendingMemberships,
      pendingPayments,
      memberCount,
      newsPublished,
      newsDraft,
      chapterCount,
    ] = await Promise.all([
      db.BniEvent.count(),
      db.BniEvent.count({ where: { createdAt: { [Op.gte]: d30 } } }),
      db.BniEvent.count({ where: { createdAt: { [Op.gte]: d60, [Op.lt]: d30 } } }),
      db.BniEvent.count({
        where: { startsAt: { [Op.gte]: now, [Op.lte]: d30Ahead }, endsAt: { [Op.gte]: now } },
      }),
      db.BusyMeetingRegistration.count(),
      db.TripFormResponse.count(),
      db.BusyMeetingRegistration.count({ where: { createdAt: { [Op.gte]: d30 } } }),
      db.BusyMeetingRegistration.count({ where: { createdAt: { [Op.gte]: d60, [Op.lt]: d30 } } }),
      db.TripFormResponse.count({ where: { submittedAt: { [Op.gte]: d30 } } }),
      db.TripFormResponse.count({ where: { submittedAt: { [Op.gte]: d60, [Op.lt]: d30 } } }),
      db.BusyMeetingRegistration.count({
        where: { attendanceStatus: { [Op.in]: ["present", "late", "substitute_present"] } },
      }),
      db.BusyMeetingRegistration.count(),
      db.PaymentOrder.sum("amount_mnt", { where: { status: { [Op.in]: ["paid", "success"] } } }),
      db.TripPayment.sum("amount", { where: { status: "PAID" } }),
      db.PaymentOrder.sum("amount_mnt", {
        where: { status: { [Op.in]: ["paid", "success"] }, createdAt: { [Op.gte]: d30 } },
      }),
      db.PaymentOrder.sum("amount_mnt", {
        where: { status: { [Op.in]: ["paid", "success"] }, createdAt: { [Op.gte]: d60, [Op.lt]: d30 } },
      }),
      db.TripFormResponse.count({ where: { status: "under_review" } }),
      db.ChapterMembership.count({ where: { status: "pending" } }),
      db.PaymentOrder.count({ where: { status: "pending" } }),
      db.LegacyMember.count({ where: { status: "active" } }),
      db.NewsArticle.count({ where: { status: "published" } }),
      db.NewsArticle.count({ where: { status: "draft" } }),
      db.Chapter.count(),
    ]);

    const tripRevLast = (await db.TripPayment.sum("amount", { where: { status: "PAID", createdAt: { [Op.gte]: d30 } } })) || 0;
    const tripRevPrev = (await db.TripPayment.sum("amount", { where: { status: "PAID", createdAt: { [Op.gte]: d60, [Op.lt]: d30 } } })) || 0;

    const totalRegistrations = (meetingRegsTotal || 0) + (tripResponsesTotal || 0);
    const regsLast30 = (meetingRegsLast30 || 0) + (tripRegsLast30 || 0);
    const regsPrev30 = (meetingRegsPrev30 || 0) + (tripRegsPrev30 || 0);

    const revenueTotalMnt = (Number(paidOrdersSum) || 0) + (Number(tripPaidSum) || 0);
    const revenueLast30Total = (Number(revenueLast30) || 0) + Number(tripRevLast);
    const revenuePrev30Total = (Number(revenuePrev30) || 0) + Number(tripRevPrev);

    res.json({
      ok: true,
      data: {
        totalEvents,
        eventGrowth: growthHint(eventsLast30, eventsPrev30, "сүүлийн 30 хоногт"),
        upcomingNext30d,
        totalRegistrations,
        registrationGrowth: growthHint(regsLast30, regsPrev30, "нийт өсөлт"),
        attendancePresent,
        attendanceTotal,
        attendancePct: attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : null,
        revenueTotalMnt,
        revenueGrowth: growthHint(revenueLast30Total, revenuePrev30Total, "сүүлийн 30 хоногт"),
        pendingApprovals: (pendingTripReviews || 0) + (pendingMemberships || 0) + (pendingPayments || 0),
        memberCount,
        newsPublished,
        newsDraft,
        chapterCount,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

/** Mirrors admin members list previously loaded via Prisma. */
exports.membersList = async (_req, res) => {
  try {
    const rows = await db.LegacyMember.findAll({
      order: [["id", "DESC"]],
      limit: 300,
      attributes: ["id", "name", "company", "industry", "email", "status"],
      raw: true,
    });
    res.json({ ok: true, rows });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};

/** Mirrors admin news list previously loaded via Prisma. */
exports.newsList = async (req, res) => {
  try {
    const status = String(req.query?.status || "").trim();
    const where = status === "draft" ? { status: "draft" } : undefined;
    const rows = await db.NewsArticle.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: 200,
      attributes: ["id", "title", "slug", "status", "createdAt"],
      raw: true,
    });
    res.json({
      ok: true,
      rows: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      })),
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};

/** Mirrors admin bni-memberships list previously loaded via Prisma. */
exports.membershipsList = async (_req, res) => {
  try {
    const rows = await db.ChapterMembership.findAll({
      order: [["id", "DESC"]],
      limit: 200,
      attributes: ["id", "status"],
      include: [
        { model: db.PlatformAccount, as: "account", attributes: ["email"] },
        { model: db.Chapter, as: "chapter", attributes: ["name"] },
      ],
    });
    res.json({
      ok: true,
      rows: rows.map((r) => ({
        id: String(r.id),
        status: String(r.status ?? ""),
        account: { email: r.account?.email ?? "" },
        chapter: { name: r.chapter?.name ?? "" },
      })),
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};

exports.paymentOrdersList = async (_req, res) => {
  try {
    const rows = await db.PaymentOrder.findAll({
      order: [["id", "DESC"]],
      limit: 200,
      attributes: ["id", "orderRef", "targetType", "targetId", "amountMnt", "status", "createdAt"],
      raw: true,
    });
    res.json({
      ok: true,
      rows: rows.map((r) => ({
        ...r,
        id: String(r.id),
        targetId: String(r.targetId),
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      })),
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) });
  }
};

exports.upsertSiteSetting = async (req, res) => {
  const settingName = String(req.body?.settingName || "").trim();
  const settingValue = String(req.body?.settingValue || "");
  if (!settingName) {
    return res.status(400).json({ ok: false, errorKey: "missing_setting_name" });
  }
  try {
    const [row] = await db.SiteSetting.findOrCreate({
      where: { settingName },
      defaults: { settingName, settingValue },
    });
    if (row.settingValue !== settingValue) {
      row.settingValue = settingValue;
      await row.save();
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) });
  }
};

exports.upsertRegion = async (req, res) => {
  const id = Number(req.body?.id || 0);
  const name = String(req.body?.name || "").trim();
  const slug = String(req.body?.slug || "").trim().toLowerCase();
  const sortOrder = Number(req.body?.sortOrder || 0);
  if (!name || !slug) return res.status(400).json({ ok: false, errorKey: "missing_fields" });
  try {
    if (id > 0) {
      const row = await db.Region.findByPk(id);
      if (!row) return res.status(404).json({ ok: false, errorKey: "not_found" });
      await row.update({ name, slug, sortOrder });
      return res.json({ ok: true, id: row.id });
    }
    const row = await db.Region.create({ name, slug, sortOrder });
    return res.json({ ok: true, id: row.id });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) });
  }
};

exports.deleteRegion = async (req, res) => {
  const id = Number(req.params?.id || 0);
  if (!(id > 0)) return res.status(400).json({ ok: false, errorKey: "invalid_id" });
  try {
    const chapterCount = await db.Chapter.count({ where: { regionId: id } });
    if (chapterCount > 0) return res.status(409).json({ ok: false, errorKey: "region_has_chapters" });
    await db.Region.destroy({ where: { id } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) });
  }
};

exports.createChapter = async (req, res) => {
  const regionId = Number(req.body?.regionId || 0);
  const name = String(req.body?.name || "").trim();
  const slug = String(req.body?.slug || "").trim().toLowerCase();
  const maxMembers = Number(req.body?.maxMembers || 40);
  const timezone = String(req.body?.timezone || "Asia/Ulaanbaatar").trim() || "Asia/Ulaanbaatar";
  if (!(regionId > 0) || !name || !slug) {
    return res.status(400).json({ ok: false, errorKey: "missing_fields" });
  }
  try {
    const row = await db.Chapter.create({ regionId, name, slug, maxMembers, timezone });
    return res.json({ ok: true, id: row.id });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) });
  }
};
