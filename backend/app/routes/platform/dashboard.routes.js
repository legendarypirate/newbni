"use strict";

module.exports = (app) => {
  const dashboard = require("../../controllers/platform/dashboard.controller");
  const authMiddleware = require("../../middleware/auth.middleware");
  const router = require("express").Router();

  router.get("/dashboard", authMiddleware, dashboard.organizerDashboard);

  app.use("/api/platform", router);
};
