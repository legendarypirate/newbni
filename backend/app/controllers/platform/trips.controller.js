"use strict";

const { Op } = require("sequelize");
const db = require("../../models");
const { readExtras } = require("../../lib/trip-helpers");
const { syncTripRegistrationFormFromLegacyJson } = require("../../lib/trip-form-sync");
const { writePlatformUploadImage, destroyCloudinaryBySecureUrl } = require("../../lib/platform-write-image");
const {
  TRIP_STATUS,
  isAdminUser,
  normalizeTripStatusLabel,
  tripStatusForPublic,
} = require("../../lib/content-approval");
const tripForms = require("../../services/trip-registration-forms");
const { translateRecords, translateOne } = require("../../lib/content-translations");

async function publishTripRegistrationForms(tripId) {
  const forms = await db.TripRegistrationForm.findAll({
    where: { tripId },
    order: [["createdAt", "ASC"]],
    attributes: ["id"],
  });
  if (forms.length === 0) return;
  const primary = forms[0];
  await tripForms.setTripRegistrationFormPublished(primary.id, null, true, { adminBypass: true });
}

async function unpublishTripRegistrationForms(tripId) {
  await db.TripRegistrationForm.update({ isPublished: false }, { where: { tripId } });
}

async function attachTripFormMeta(trips) {
  const ids = trips.map((t) => t.id).filter(Boolean);
  if (ids.length === 0) return trips;
  const forms = await db.TripRegistrationForm.findAll({
    where: { tripId: { [Op.in]: ids } },
    attributes: ["tripId", "isPublished", "publicSlug"],
    order: [["createdAt", "ASC"]],
  });
  const byTrip = new Map();
  for (const f of forms) {
    if (!byTrip.has(f.tripId)) {
      byTrip.set(f.tripId, { formIsPublished: f.isPublished, registrationPublicSlug: f.publicSlug });
    }
  }
  return trips.map((t) => {
    const plain = typeof t.toJSON === "function" ? t.toJSON() : { ...t };
    const meta = byTrip.get(plain.id) || { formIsPublished: false, registrationPublicSlug: null };
    return { ...plain, ...meta, approvalStatus: normalizeTripStatusLabel(plain.statusLabel) };
  });
}

function parseJsonOrNull(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

exports.saveTrip = async (req, res) => {
  const accountId = req.user.id;
  const formData = req.body;
  const files = req.files || {};

  const tripId = Math.max(0, Number(formData.trip_id || "0"));
  const destination = (formData.trip_destination || "").trim();
  const start = formData.trip_start_date ? new Date(formData.trip_start_date) : null;
  const end = formData.trip_end_date ? new Date(formData.trip_end_date) : null;
  const focus = (formData.trip_focus || "").trim() || null;
  const description = (formData.trip_description || "").trim() || null;
  const totalSeats = Math.max(0, Number(formData.trip_total_seats || "30") || 30);
  const seatsLabel = `${totalSeats} суудал`;
  const advancePct = Math.max(0, Number(formData.trip_advance_percent || "20") || 20);

  if (destination === "" || !start || !end) {
    return res.status(400).json({ ok: false, message: "Missing required fields" });
  }

  try {
    let existing = null;
    if (tripId > 0) {
      existing = await db.BusinessTrip.findByPk(tripId);
      if (!existing) return res.status(404).json({ ok: false, message: "Trip not found" });
      const isAdmin = isAdminUser(req.user);
      if (
        !isAdmin &&
        existing.managerAccountId &&
        String(existing.managerAccountId) !== String(accountId)
      ) {
        return res.status(403).json({ ok: false, message: "Forbidden" });
      }
    }

    const isAdmin = isAdminUser(req.user);
    let statusLabel = isAdmin
      ? normalizeTripStatusLabel((formData.trip_status_label || "").trim() || TRIP_STATUS.DRAFT)
      : TRIP_STATUS.PENDING;
    if (isAdmin && tripId > 0 && statusLabel === TRIP_STATUS.APPROVED) {
      // keep admin-selected approved
    } else if (!isAdmin) {
      statusLabel = TRIP_STATUS.PENDING;
    }

    let coverImageUrl = existing?.coverImageUrl || null;
    if (files.trip_cover_file) {
      const f = files.trip_cover_file[0];
      const up = await writePlatformUploadImage(accountId, f.buffer, f.mimetype, f.size, 10 * 1024 * 1024);
      if (up.ok) {
        if (coverImageUrl && coverImageUrl.includes("cloudinary")) {
          await destroyCloudinaryBySecureUrl(coverImageUrl);
        }
        coverImageUrl = up.url;
      }
    }

    const slides = Array.isArray(formData.trip_existing_slides) ? formData.trip_existing_slides : (formData.trip_existing_slides ? [formData.trip_existing_slides] : []);
    if (files.trip_hero_files) {
      for (const f of files.trip_hero_files) {
        const up = await writePlatformUploadImage(accountId, f.buffer, f.mimetype, f.size, 10 * 1024 * 1024);
        if (up.ok) slides.push(up.url);
      }
    }
    const heroSliderJson = slides.length > 0 ? JSON.stringify(slides) : null;

    const extras = readExtras(existing?.extrasJson);
    extras.short_description = (formData.trip_short_description || "").trim();
    extras.location = (formData.trip_location || "").trim();
    extras.total_seats = totalSeats;
    extras.advance_percent = advancePct;
    extras.booking_status_note = (formData.trip_booking_status_note || "").trim();
    extras.trip_manager_phone = (formData.trip_manager_phone || "").trim();
    extras.trip_help_email = (formData.trip_help_email || "").trim();
    extras.trip_help_chat_url = (formData.trip_help_chat_url || "").trim();
    extras.trip_registration_close_date = (formData.trip_registration_close_date || "").trim();

    const bookingTiers = parseJsonOrNull(formData.trip_booking_tiers_json);
    if (Array.isArray(bookingTiers)) {
      extras.booking_tiers = bookingTiers;
    }

    if (formData.trip_details_hero_clear === "on" || formData.trip_details_hero_clear === "1") {
      extras.trip_details_hero_url = "";
    }
    if (files.trip_detail_hero_file?.[0]) {
      const f = files.trip_detail_hero_file[0];
      const up = await writePlatformUploadImage(accountId, f.buffer, f.mimetype, f.size, 10 * 1024 * 1024);
      if (up.ok) {
        if (extras.trip_details_hero_url && extras.trip_details_hero_url.includes("cloudinary")) {
          await destroyCloudinaryBySecureUrl(extras.trip_details_hero_url);
        }
        extras.trip_details_hero_url = up.url;
      }
    }
    
    const common = {
      destination,
      startDate: start,
      endDate: end,
      focus,
      description,
      statusLabel,
      seatsLabel,
      coverImageUrl,
      heroSliderJson,
      priceMnt: formData.trip_price_mnt || null,
      advanceOrderMnt: formData.trip_advance_order_mnt || null,
      extrasJson: extras,
      registrationFormJson: parseJsonOrNull(formData.trip_registration_form_json) || existing?.registrationFormJson || null,
      itineraryJson: parseJsonOrNull(formData.trip_itinerary_json) || existing?.itineraryJson || null,
    };

    let trip;
    if (tripId > 0) {
      await existing.update(common);
      trip = existing;
    } else {
      trip = await db.BusinessTrip.create({
        ...common,
        managerAccountId: accountId,
        isFeatured: 0,
      });
    }

    await syncTripRegistrationFormFromLegacyJson(trip.id, trip.registrationFormJson);

    if (statusLabel === TRIP_STATUS.APPROVED) {
      await publishTripRegistrationForms(trip.id);
    } else if (!isAdmin) {
      await unpublishTripRegistrationForms(trip.id);
    }

    res.json({ ok: true, tripId: trip.id, statusLabel });
  } catch (err) {
    console.error("Save trip failed:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
};

exports.listTrips = async (req, res) => {
  try {
    const { country, focus, date_from, date_to, trip_type, budget_max, mine } = req.query;
    const where = {};
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // `mine=1` → only return trips owned by the authenticated user
    // (used by the platform "Миний аялалууд" panel).
    const mineOnly = String(mine || "") === "1" && req.user?.id;
    const listAll = String(req.query.all || "") === "1" && isAdminUser(req.user);
    if (mineOnly) {
      where.managerAccountId = req.user.id;
    } else if (!listAll) {
      where.statusLabel = tripStatusForPublic();
    }

    if (country) {
      where.destination = { [Op.iLike]: `%${country}%` };
    }

    if (focus) {
      where[Op.or] = [
        { focus: { [Op.iLike]: `%${focus}%` } },
        { description: { [Op.iLike]: `%${focus}%` } },
      ];
    }

    if (date_from || date_to) {
      where.startDate = {};
      if (date_from) where.startDate[Op.gte] = new Date(date_from);
      if (date_to) where.startDate[Op.lte] = new Date(date_to);
    }

    if (trip_type === "near") {
      const next90Days = new Date(now);
      next90Days.setDate(next90Days.getDate() + 90);
      where.startDate = { [Op.gte]: now, [Op.lte]: next90Days };
    } else if (trip_type === "vip") {
      where.statusLabel = { [Op.iLike]: "%VIP%" };
    } else if (trip_type === "factory") {
      where[Op.or] = [
        { focus: { [Op.iLike]: "%үйлдвэр%" } },
        { description: { [Op.iLike]: "%үйлдвэр%" } },
      ];
    } else if (trip_type === "expo") {
      where[Op.or] = [
        { focus: { [Op.iLike]: "%үзэсгэлэн%" } },
        { description: { [Op.iLike]: "%үзэсгэлэн%" } },
      ];
    } else if (trip_type === "trip") {
      where[Op.or] = [
        { focus: { [Op.iLike]: "%business trip%" } },
        { focus: { [Op.iLike]: "%аялал%" } },
        { description: { [Op.iLike]: "%business trip%" } },
      ];
    }

    const budgetMax = parseInt(budget_max);
    if (!isNaN(budgetMax) && budgetMax > 0) {
      where.priceMnt = { [Op.lte]: budgetMax };
    }

    const rows = await db.BusinessTrip.findAll({
      where,
      order: [
        ["isFeatured", "DESC"],
        ["startDate", "ASC"],
        ["id", "ASC"],
      ],
      limit: 200,
    });

    const lang = req.bniLang || "mn";
    let tripsOut = await attachTripFormMeta(rows);
    tripsOut = await translateRecords(tripsOut, "trip", lang);

    const next90 = new Date(now);
    next90.setDate(next90.getDate() + 90);

    const publicWhere = { statusLabel: tripStatusForPublic() };
    const [totalTrips, nearTrips, registeredMembers] = await Promise.all([
      db.BusinessTrip.count({ where: publicWhere }),
      db.BusinessTrip.count({
        where: { ...publicWhere, startDate: { [Op.gte]: now, [Op.lte]: next90 } },
      }),
      db.PaymentOrder.count({
        where: { targetType: "trip", status: { [Op.in]: ["paid", "success"] } },
      }),
    ]);

    res.json({
      ok: true,
      data: {
        trips: tripsOut,
        totalTrips,
        nearTrips,
        registeredMembers,
      },
    });
  } catch (err) {
    console.error("List trips failed:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
};

exports.getTrip = async (req, res) => {
  try {
    const trip = await db.BusinessTrip.findByPk(req.params.id);
    if (!trip) return res.status(404).json({ ok: false, message: "Trip not found" });

    const isOwner =
      req.user?.id && trip.managerAccountId && String(trip.managerAccountId) === String(req.user.id);
    const isAdmin = isAdminUser(req.user);
    const approved = normalizeTripStatusLabel(trip.statusLabel) === TRIP_STATUS.APPROVED;
    if (!approved && !isOwner && !isAdmin) {
      return res.status(404).json({ ok: false, message: "Trip not found" });
    }

    const lang = req.bniLang || "mn";
    const [enriched] = await attachTripFormMeta([trip]);
    const tripOut = await translateOne(enriched, "trip", lang, { autoFillMissing: true });
    res.json({ ok: true, trip: tripOut });
  } catch (err) {
    console.error("Get trip failed:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
};

exports.registrationFormMeta = async (req, res) => {
  const tripId = Math.max(0, Number(req.params.id || "0"));
  if (tripId < 1) return res.status(400).json({ ok: false, error: "invalid_id" });
  try {
    const trip = await db.BusinessTrip.findByPk(tripId, {
      attributes: ["id", "destination", "startDate", "endDate", "statusLabel", "managerAccountId"],
    });
    if (!trip) return res.status(404).json({ ok: false, error: "not_found" });

    const isOwner =
      req.user?.id && trip.managerAccountId && String(trip.managerAccountId) === String(req.user.id);
    if (!isOwner && !isAdminUser(req.user)) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    const form = await db.TripRegistrationForm.findOne({
      where: { tripId },
      order: [["createdAt", "ASC"]],
      attributes: ["id", "publicSlug", "isPublished", "title"],
    });

    res.json({
      ok: true,
      trip: {
        id: trip.id,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        statusLabel: trip.statusLabel,
      },
      form: form
        ? {
            id: form.id,
            publicSlug: form.publicSlug,
            isPublished: form.isPublished,
            title: form.title,
          }
        : null,
    });
  } catch (err) {
    console.error("trip registrationFormMeta failed:", err);
    res.status(500).json({ ok: false, error: "failed" });
  }
};

/** Admin: approve or reject a trip for public listing. */
exports.setTripApproval = async (req, res) => {
  const tripId = Math.max(0, Number(req.params.id || "0"));
  const action = String(req.body?.action || "").trim().toLowerCase();
  if (tripId < 1 || !["approve", "reject"].includes(action)) {
    return res.status(400).json({ ok: false, errorKey: "invalid" });
  }
  if (!isAdminUser(req.user)) {
    return res.status(403).json({ ok: false, errorKey: "forbidden" });
  }
  try {
    const trip = await db.BusinessTrip.findByPk(tripId);
    if (!trip) return res.status(404).json({ ok: false, errorKey: "not_found" });

    const nextStatus = action === "approve" ? TRIP_STATUS.APPROVED : TRIP_STATUS.REJECTED;
    await trip.update({ statusLabel: nextStatus });
    if (action === "approve") {
      await publishTripRegistrationForms(tripId);
    } else {
      await unpublishTripRegistrationForms(tripId);
    }

    res.json({ ok: true, statusLabel: nextStatus });
  } catch (err) {
    console.error("setTripApproval failed:", err);
    res.status(500).json({ ok: false, errorKey: "failed" });
  }
};

exports.deleteTrip = async (req, res) => {
  const id = Math.max(0, Number(req.params.id || "0"));
  if (id < 1) return res.status(400).json({ ok: false, errorKey: "invalid_trip_id" });
  try {
    const trip = await db.BusinessTrip.findByPk(id);
    if (!trip) return res.status(404).json({ ok: false, errorKey: "not_found" });
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "admin" || req.user?.isAdmin === true;
    if (!isAdmin && userId && trip.managerAccountId && String(trip.managerAccountId) !== String(userId)) {
      return res.status(403).json({ ok: false, errorKey: "forbidden" });
    }
    await trip.destroy();
    return res.json({ ok: true });
  } catch (err) {
    console.error("Delete trip failed:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
};

exports.toggleFeatured = async (req, res) => {
  const id = parseInt(req.params.id);
  const { isFeatured } = req.body;
  if (isNaN(id) || id < 1) return res.status(400).json({ ok: false });

  try {
    const trip = await db.BusinessTrip.findByPk(id);
    if (!trip) return res.status(404).json({ ok: false, errorKey: "notfound" });

    const userId = req.user?.id;
    const isAdmin = req.user?.role === "admin" || req.user?.isAdmin === true;
    if (!isAdmin && userId && trip.managerAccountId && String(trip.managerAccountId) !== String(userId)) {
      return res.status(403).json({ ok: false, errorKey: "forbidden" });
    }

    if (isFeatured) {
      const featuredCount = await db.BusinessTrip.count({
        where: { isFeatured: 1, id: { [Op.ne]: id } },
      });
      if (trip.isFeatured !== 1 && featuredCount >= 3) {
        return res.status(400).json({ ok: false, errorKey: "featured_limit" });
      }
    }

    await trip.update({ isFeatured: isFeatured ? 1 : 0 });
    res.json({ ok: true });
  } catch (err) {
    console.error("Toggle featured failed:", err);
    res.status(500).json({ ok: false });
  }
};

