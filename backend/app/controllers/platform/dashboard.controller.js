"use strict";

const { Op } = require("sequelize");
const db = require("../../models");

/**
 * User-scoped organizer dashboard for `/platform`.
 *
 * Scope rules (admin/super_admin/event_manager bypass user filters):
 *   - Trips: rows where `managerAccountId = req.user.id`.
 *   - Trip responses / participants / payments: trips above only.
 *   - BNI events: events in chapters where the user holds an active membership
 *     (privileged roles see every chapter).
 *
 * Empty-by-default: when the user owns nothing, every block returns zeros and
 * empty arrays — no fake placeholder content.
 */

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

function isPrivilegedRole(role) {
  return role === "admin" || role === "super_admin" || role === "event_manager";
}

async function loadAccessibleChapterIds(userId) {
  if (!userId) return [];
  try {
    const memberships = await db.ChapterMembership.findAll({
      where: { accountId: userId, status: { [Op.in]: ["active", "approved"] } },
      attributes: ["chapterId"],
      raw: true,
    });
    return memberships
      .map((m) => Number(m.chapterId))
      .filter((n) => Number.isFinite(n) && n > 0);
  } catch {
    return [];
  }
}

exports.organizerDashboard = async (req, res) => {
  try {
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const d30Ahead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const userId = req.user?.id;
    const role = String(req.user?.role || "");
    const privileged = isPrivilegedRole(role);

    // ---------------------------------------------------------------- scopes
    const tripWhere = privileged ? {} : { managerAccountId: userId };
    const userTrips = await db.BusinessTrip.findAll({
      where: tripWhere,
      attributes: [
        "id",
        "destination",
        "startDate",
        "endDate",
        "coverImageUrl",
        "statusLabel",
        "priceMnt",
        "isFeatured",
        "createdAt",
      ],
      order: [["startDate", "DESC"]],
      limit: 200,
      raw: true,
    });
    const tripIds = userTrips.map((t) => t.id);

    let eventWhere;
    if (privileged) {
      eventWhere = {};
    } else {
      const chapterIds = await loadAccessibleChapterIds(userId);
      eventWhere = chapterIds.length > 0 ? { chapterId: { [Op.in]: chapterIds } } : { id: -1 };
    }

    const userEvents = await db.BniEvent.findAll({
      where: eventWhere,
      attributes: [
        "id",
        "title",
        "eventType",
        "startsAt",
        "endsAt",
        "location",
        "isOnline",
        "chapterId",
        "priceMnt",
      ],
      order: [["startsAt", "DESC"]],
      limit: 200,
      raw: true,
    });

    // ------------------------------------------------------------- aggregates
    const hasTrips = tripIds.length > 0;
    const tripFilter = hasTrips ? { tripId: { [Op.in]: tripIds } } : null;

    const [
      totalEventsBni,
      upcomingEvents,
      eventsLast30,
      eventsPrev30,
      tripResponseTotal,
      tripResponseLast30,
      tripResponsePrev30,
      tripPaidSum,
      tripPaidLast30,
      tripPaidPrev30,
      pendingResponses,
      tripResponseStatusRows,
      participantsRecent,
    ] = await Promise.all([
      db.BniEvent.count({ where: eventWhere }),
      db.BniEvent.count({
        where: {
          ...eventWhere,
          startsAt: { [Op.gte]: now, [Op.lte]: d30Ahead },
          endsAt: { [Op.gte]: now },
        },
      }),
      db.BniEvent.count({ where: { ...eventWhere, createdAt: { [Op.gte]: d30 } } }),
      db.BniEvent.count({ where: { ...eventWhere, createdAt: { [Op.gte]: d60, [Op.lt]: d30 } } }),
      hasTrips ? db.TripFormResponse.count({ where: tripFilter }) : 0,
      hasTrips
        ? db.TripFormResponse.count({
            where: { ...tripFilter, submittedAt: { [Op.gte]: d30 } },
          })
        : 0,
      hasTrips
        ? db.TripFormResponse.count({
            where: { ...tripFilter, submittedAt: { [Op.gte]: d60, [Op.lt]: d30 } },
          })
        : 0,
      hasTrips
        ? db.TripPayment.sum("amount", {
            where: { tripId: { [Op.in]: tripIds }, status: "PAID" },
          })
        : 0,
      hasTrips
        ? db.TripPayment.sum("amount", {
            where: {
              tripId: { [Op.in]: tripIds },
              status: "PAID",
              createdAt: { [Op.gte]: d30 },
            },
          })
        : 0,
      hasTrips
        ? db.TripPayment.sum("amount", {
            where: {
              tripId: { [Op.in]: tripIds },
              status: "PAID",
              createdAt: { [Op.gte]: d60, [Op.lt]: d30 },
            },
          })
        : 0,
      hasTrips
        ? db.TripFormResponse.count({ where: { ...tripFilter, status: "UNDER_REVIEW" } })
        : 0,
      hasTrips
        ? db.TripFormResponse.findAll({
            where: tripFilter,
            attributes: ["status", "paymentStatus"],
            raw: true,
          })
        : [],
      hasTrips
        ? db.TripParticipant.findAll({
            where: { tripId: { [Op.in]: tripIds } },
            attributes: [
              "id",
              "fullName",
              "companyName",
              "status",
              "paymentStatus",
              "createdAt",
            ],
            order: [["createdAt", "DESC"]],
            limit: 5,
            raw: true,
          })
        : [],
    ]);

    const tripResponseTotalNum = Number(tripResponseTotal || 0);
    const totalRegistrations = tripResponseTotalNum;
    const regsLast30 = Number(tripResponseLast30 || 0);
    const regsPrev30 = Number(tripResponsePrev30 || 0);

    const revenueTotalMnt = Number(tripPaidSum || 0);
    const revenueLast30 = Number(tripPaidLast30 || 0);
    const revenuePrev30 = Number(tripPaidPrev30 || 0);

    // Status / funnel breakdown derived from trip responses.
    let confirmed = 0;
    let pending = 0;
    let cancelled = 0;
    let paid = 0;
    for (const row of tripResponseStatusRows) {
      const s = String(row.status || "").toUpperCase();
      const ps = String(row.paymentStatus || "").toUpperCase();
      if (s === "CONFIRMED" || s === "APPROVED") confirmed += 1;
      else if (s === "CANCELLED" || s === "REJECTED") cancelled += 1;
      else pending += 1;
      if (ps === "PAID" || ps === "EXEMPTED") paid += 1;
    }

    const metrics = {
      totalEvents: Number(totalEventsBni) + userTrips.length,
      eventGrowth: growthHint(Number(eventsLast30), Number(eventsPrev30), "сүүлийн 30 хоногт"),
      upcomingNext30d: Number(upcomingEvents),
      totalRegistrations,
      registrationGrowth: growthHint(regsLast30, regsPrev30, "нийт өсөлт"),
      attendancePresent: confirmed,
      attendanceTotal: tripResponseTotalNum,
      attendancePct:
        tripResponseTotalNum > 0
          ? Math.round((confirmed / tripResponseTotalNum) * 100)
          : null,
      revenueTotalMnt,
      revenueGrowth: growthHint(revenueLast30, revenuePrev30, "сүүлийн 30 хоногт"),
      pendingApprovals: Number(pendingResponses || 0),
    };

    // ------------------------------------------------------------- events table
    const tripCountsByTrip = new Map();
    if (hasTrips) {
      const rows = await db.TripFormResponse.findAll({
        where: tripFilter,
        attributes: [
          "tripId",
          [db.sequelize.fn("COUNT", db.sequelize.col("id")), "cnt"],
        ],
        group: ["trip_id"],
        raw: true,
      });
      for (const r of rows) {
        tripCountsByTrip.set(String(r.tripId), Number(r.cnt) || 0);
      }
    }

    const eventTableRows = [
      ...userEvents.map((e) => ({
        kind: "event",
        id: String(e.id),
        title: e.title || "—",
        eventType: e.eventType || "event",
        startsAt: e.startsAt instanceof Date ? e.startsAt.toISOString() : String(e.startsAt),
        endsAt: e.endsAt instanceof Date ? e.endsAt.toISOString() : String(e.endsAt),
        location: e.location || "",
        isOnline: !!e.isOnline,
        registeredCount: 0,
        capacity: null,
        statusLabel: null,
        coverUrl: null,
      })),
      ...userTrips.map((t) => ({
        kind: "trip",
        id: String(t.id),
        title: t.destination || "—",
        eventType: "trip",
        startsAt: t.startDate instanceof Date ? t.startDate.toISOString() : String(t.startDate),
        endsAt: t.endDate instanceof Date ? t.endDate.toISOString() : String(t.endDate),
        location: "",
        isOnline: false,
        registeredCount: tripCountsByTrip.get(String(t.id)) || 0,
        capacity: null,
        statusLabel: t.statusLabel ?? null,
        coverUrl: t.coverImageUrl ?? null,
      })),
    ]
      .sort((a, b) => (a.startsAt < b.startsAt ? 1 : a.startsAt > b.startsAt ? -1 : 0))
      .slice(0, 10);

    // ------------------------------------------------------------- funnel + donut
    const funnel = {
      interested: tripResponseTotalNum,
      registered: tripResponseTotalNum,
      paid,
      attended: confirmed,
    };
    const statusBreakdown = {
      confirmed,
      pending,
      attended: confirmed,
      cancelled,
      total: tripResponseTotalNum,
    };

    // ------------------------------------------------------------- recent attendees
    const recentAttendees = (participantsRecent || []).map((p) => ({
      id: String(p.id),
      fullName: p.fullName || "—",
      company: p.companyName || "",
      status: String(p.status || "REGISTERED"),
      paymentStatus: String(p.paymentStatus || "UNPAID"),
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    }));

    // ------------------------------------------------------------- top events
    const topEvents = eventTableRows
      .slice()
      .sort((a, b) => b.registeredCount - a.registeredCount)
      .slice(0, 3)
      .map((r) => ({ title: r.title, count: r.registeredCount }));

    // ------------------------------------------------------------- tickets
    const tickets = [];
    for (const t of userTrips.slice(0, 4)) {
      const price = Number(t.priceMnt || 0);
      tickets.push({
        label: t.destination,
        priceMnt: price,
        free: price <= 0,
        active: true,
      });
    }
    for (const e of userEvents.slice(0, 2)) {
      const price = Number(e.priceMnt || 0);
      tickets.push({
        label: e.title || "BNI хурал",
        priceMnt: price,
        free: price <= 0,
        active: true,
      });
    }

    // ------------------------------------------------------------- schedule
    let schedule = [];
    const nextEvent = userEvents
      .slice()
      .filter((e) => new Date(e.startsAt) >= now)
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))[0];
    if (nextEvent) {
      const full = await db.BniEvent.findByPk(nextEvent.id, {
        attributes: ["curriculumOverrideJson"],
        raw: true,
      });
      const raw = full?.curriculumOverrideJson;
      if (raw && Array.isArray(raw.sections)) {
        schedule = raw.sections.slice(0, 4).map((sec, idx) => ({
          time: typeof sec.time === "string" ? sec.time : `${idx + 1}.`,
          title: typeof sec.title === "string" ? sec.title : "—",
        }));
      }
    }

    // ------------------------------------------------------------- sparkline
    let sparkline = [0, 0, 0, 0, 0, 0, 0];
    if (hasTrips) {
      const buckets = await Promise.all(
        Array.from({ length: 7 }, (_, idx) => {
          const i = 6 - idx;
          const start = new Date(now);
          start.setHours(0, 0, 0, 0);
          start.setDate(start.getDate() - i);
          const end = new Date(start);
          end.setDate(end.getDate() + 1);
          return db.TripFormResponse.count({
            where: { ...tripFilter, submittedAt: { [Op.gte]: start, [Op.lt]: end } },
          });
        }),
      );
      sparkline = buckets.map((n) => Number(n) || 0);
    }

    return res.json({
      ok: true,
      data: {
        scope: privileged ? "admin" : "user",
        metrics,
        events: eventTableRows,
        funnel,
        statusBreakdown,
        recentAttendees,
        topEvents,
        tickets,
        schedule,
        sparkline,
        revenueLast30,
      },
    });
  } catch (err) {
    console.error("organizerDashboard failed:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};
