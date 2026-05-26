"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/home.controller");
  const optionalPlatformUser = require("../middleware/optional-platform-user.middleware");
  const router = express.Router();

  router.get("/home", optionalPlatformUser, ctrl.getHome);

  app.use("/api", router);
};

