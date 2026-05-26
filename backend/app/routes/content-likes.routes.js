"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/content-likes.controller");
  const { requirePlatformUser } = require("../middleware/require-platform-user");
  const optionalPlatformUser = require("../middleware/optional-platform-user.middleware");

  const router = express.Router();

  router.post("/likes/toggle", requirePlatformUser, ctrl.toggle);
  router.get("/likes", optionalPlatformUser, ctrl.batch);

  app.use("/api", router);
};
