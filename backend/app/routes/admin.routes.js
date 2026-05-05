"use strict";

module.exports = (app) => {
  const multer = require("multer");
  const storage = multer.memoryStorage();
  const upload = multer({ storage });
  const admin = require("../controllers/admin.controller");
  const uploads = require("../controllers/admin/uploads.controller");
  const platformAccounts = require("../controllers/admin/platform-accounts.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const requirePlatformAdminJwt = require("../middleware/admin-role.middleware");
  const router = require("express").Router();

  router.get("/dashboard-stats", admin.dashboardStats);

  router.get("/platform-accounts", authMiddleware, requirePlatformAdminJwt, platformAccounts.listPlatformAccounts);
  router.post("/platform-accounts", authMiddleware, requirePlatformAdminJwt, platformAccounts.createPlatformStaffUser);
  router.patch("/platform-accounts/:id", authMiddleware, requirePlatformAdminJwt, platformAccounts.patchPlatformAccountRole);
  router.post(
    "/platform-accounts/:id/ensure-organizer",
    authMiddleware,
    requirePlatformAdminJwt,
    platformAccounts.ensureOrganizerForPlatformAccount,
  );
  router.post(
    "/system/ensure-busy-rbac-seed",
    authMiddleware,
    requirePlatformAdminJwt,
    platformAccounts.ensureBusyRbacSeedHttp,
  );
  router.post(
    "/marketing-listing-hero-upload",
    authMiddleware,
    upload.array("files", 20),
    uploads.uploadMarketingListingHero,
  );

  app.use("/api/admin", router);
};
