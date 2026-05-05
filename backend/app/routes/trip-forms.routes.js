"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/trip-forms.controller");
  const { requirePlatformUser } = require("../middleware/require-platform-user");
  const router = express.Router();

  router.get("/trips/:tripId/forms", requirePlatformUser, ctrl.list);
  router.post("/trips/:tripId/forms", requirePlatformUser, ctrl.create);

  app.use("/api", router);
};
