"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/weekly-meeting.controller");
  const { requirePlatformUser } = require("../middleware/require-platform-user");
  const router = express.Router();

  router.get("/meetings/weekly", requirePlatformUser, ctrl.list);
  router.post("/meetings/weekly", requirePlatformUser, ctrl.create);

  app.use("/api", router);
};
