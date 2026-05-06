"use strict";

const db = require("../../models");
const { readExtras } = require("../../lib/trip-helpers");
const { syncTripRegistrationFormFromLegacyJson } = require("../../lib/trip-form-sync");
const { writePlatformUploadImage, destroyCloudinaryBySecureUrl } = require("../../lib/platform-write-image");

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
  const statusLabel = (formData.trip_status_label || "").trim() || null;
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

    res.json({ ok: true, tripId: trip.id });
  } catch (err) {
    console.error("Save trip failed:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
};

exports.listTrips = async (req, res) => {
  try {
    const { country, focus, date_from, date_to, trip_type, budget_max } = req.query;
    const where = {};
    const now = new Date();
    now.setHours(0, 0, 0, 0);

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

    const next90 = new Date(now);
    next90.setDate(next90.getDate() + 90);

    const [totalTrips, nearTrips, registeredMembers] = await Promise.all([
      db.BusinessTrip.count(),
      db.BusinessTrip.count({ where: { startDate: { [Op.gte]: now, [Op.lte]: next90 } } }),
      db.PaymentOrder.count({
        where: { targetType: "trip", status: { [Op.in]: ["paid", "success"] } },
      }),
    ]);

    res.json({
      ok: true,
      data: {
        trips: rows,
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
    res.json({ ok: true, trip });
  } catch (err) {
    console.error("Get trip failed:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
};

exports.deleteTrip = async (req, res) => {
  const id = Math.max(0, Number(req.params.id || "0"));
  if (id < 1) return res.status(400).json({ ok: false, errorKey: "invalid_trip_id" });
  try {
    const deleted = await db.BusinessTrip.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ ok: false, errorKey: "not_found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Delete trip failed:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
};

exports.toggleFeatured = async (req, res) => {
  const id = parseInt(req.params.id);
  const { isFeatured } = req.body;
  const { Op } = require("sequelize");
  if (isNaN(id) || id < 1) return res.status(400).json({ ok: false });

  try {
    const trip = await db.BusinessTrip.findByPk(id);
    if (!trip) return res.status(404).json({ ok: false, errorKey: "notfound" });

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

