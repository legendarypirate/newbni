"use strict";

module.exports = (app) => {
  const multer = require("multer");
  const storage = multer.memoryStorage();
  const upload = multer({ storage });
  const admin = require("../controllers/admin.controller");
  const uploads = require("../controllers/admin/uploads.controller");
  const adminEvents = require("../controllers/admin/events-admin.controller");
  const regExport = require("../controllers/admin-registration-export.controller");
  const translationsAdmin = require("../controllers/translations-admin.controller");
  const platformAccounts = require("../controllers/admin/platform-accounts.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const requirePlatformAdminJwt = require("../middleware/admin-role.middleware");
  const router = require("express").Router();

  router.get("/dashboard-stats", admin.dashboardStats);
  router.get("/members", authMiddleware, requirePlatformAdminJwt, admin.membersList);
  router.get("/news", authMiddleware, requirePlatformAdminJwt, admin.newsList);
  router.get("/bni-memberships", authMiddleware, requirePlatformAdminJwt, admin.membershipsList);
  router.get("/payment-orders", authMiddleware, requirePlatformAdminJwt, admin.paymentOrdersList);
  router.post("/site-settings/upsert", authMiddleware, requirePlatformAdminJwt, admin.upsertSiteSetting);
  router.post("/regions", authMiddleware, requirePlatformAdminJwt, admin.upsertRegion);
  router.delete("/regions/:id", authMiddleware, requirePlatformAdminJwt, admin.deleteRegion);
  router.post("/chapters", authMiddleware, requirePlatformAdminJwt, admin.createChapter);

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
  router.get("/events/bootstrap", authMiddleware, requirePlatformAdminJwt, adminEvents.bootstrap);
  router.get(
    "/trips/:tripId/registration-responses/export",
    authMiddleware,
    requirePlatformAdminJwt,
    regExport.tripCsv,
  );
  router.get(
    "/events/:eventId/registration-responses/export",
    authMiddleware,
    requirePlatformAdminJwt,
    regExport.eventCsv,
  );
  router.post("/events", authMiddleware, requirePlatformAdminJwt, adminEvents.upsert);
  router.patch("/events/:id", authMiddleware, requirePlatformAdminJwt, adminEvents.upsert);
  router.post("/events/:id/approval", authMiddleware, requirePlatformAdminJwt, adminEvents.setApproval);
  router.delete("/events/:id", authMiddleware, requirePlatformAdminJwt, adminEvents.remove);
  router.post("/trips/:id/approval", authMiddleware, requirePlatformAdminJwt, require("../controllers/platform/trips.controller").setTripApproval);
  router.post("/translations/auto", authMiddleware, requirePlatformAdminJwt, translationsAdmin.autoTranslate);
  router.post("/translations/auto-batch", authMiddleware, requirePlatformAdminJwt, translationsAdmin.autoTranslateBatch);
  router.post("/translations/text", authMiddleware, requirePlatformAdminJwt, translationsAdmin.translateText);
  router.post("/translations/upsert", authMiddleware, requirePlatformAdminJwt, translationsAdmin.upsertManual);
  router.post(
    "/marketing-listing-hero-upload",
    authMiddleware,
    upload.array("files", 20),
    uploads.uploadMarketingListingHero,
  );

  app.use("/api/admin", router);
};
