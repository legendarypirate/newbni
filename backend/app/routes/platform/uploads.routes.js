"use strict";

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = (app) => {
  const ctrl = require("../../controllers/platform/uploads.controller");
  const authMiddleware = require("../../middleware/auth.middleware");
  const router = require("express").Router();

  router.post("/event-detail-hero-upload", authMiddleware, upload.single("file"), ctrl.uploadEventDetailHero);
  router.post("/event-speaker-photo", authMiddleware, upload.single("file"), ctrl.uploadEventSpeakerPhoto);
  router.post("/trip-itinerary-day-banner-upload", authMiddleware, upload.single("file"), ctrl.uploadTripItineraryDayBanner);

  app.use("/api/platform", router);
};

