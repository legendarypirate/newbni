"use strict";

module.exports = (app) => {
  const multer = require("multer");
  const storage = multer.memoryStorage();
  const upload = multer({ storage });
  const admin = require("../controllers/admin.controller");
  const uploads = require("../controllers/admin/uploads.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const router = require("express").Router();

  router.get("/dashboard-stats", admin.dashboardStats);
  router.post(
    "/marketing-listing-hero-upload",
    authMiddleware,
    upload.array("files", 20),
    uploads.uploadMarketingListingHero,
  );

  app.use("/api/admin", router);
};
