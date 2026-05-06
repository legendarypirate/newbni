"use strict";

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = (app) => {
  const trips = require("../../controllers/platform/trips.controller");
  const authMiddleware = require("../../middleware/auth.middleware");
  const router = require("express").Router();

  router.post(
    "/trips/save",
    authMiddleware,
    upload.fields([
      { name: "trip_cover_file", maxCount: 1 },
      { name: "trip_hero_files", maxCount: 10 },
      { name: "trip_detail_hero_file", maxCount: 1 },
    ]),
    trips.saveTrip
  );

  router.get("/trips", authMiddleware, trips.listTrips);
  router.get("/trips/:id", authMiddleware, trips.getTrip);
  router.delete("/trips/:id", authMiddleware, trips.deleteTrip);
  router.post("/trips/:id/toggle-featured", authMiddleware, trips.toggleFeatured);

  app.use("/api/platform", router);
};
