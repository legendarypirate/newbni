"use strict";

module.exports = (app) => {
  const adminEvents = require("../../controllers/admin/events-admin.controller");
  const authMiddleware = require("../../middleware/auth.middleware");
  const router = require("express").Router();

  router.get("/events/bootstrap", authMiddleware, adminEvents.bootstrap);

  app.use("/api/platform", router);
};
