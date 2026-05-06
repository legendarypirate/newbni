"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/weekly-meeting.controller");
  const { requirePlatformUser } = require("../middleware/require-platform-user");
  const router = express.Router();

  router.get("/meetings/weekly", requirePlatformUser, ctrl.list);
  router.post("/meetings/weekly", requirePlatformUser, ctrl.create);
  router.get("/meetings/weekly/:id", requirePlatformUser, ctrl.getById);
  router.post("/meetings/weekly/register-public", ctrl.registerPublic);
  router.get("/meetings/weekly/public/:token", ctrl.getByPublicToken);
  router.get("/meetings/weekly/:id/qr", ctrl.getQr);
  router.get("/meetings/weekly/:id/roster", ctrl.getRosterCsv);
  router.post("/meetings/weekly/log-roster-export", requirePlatformUser, ctrl.logRosterExport);
  router.patch("/meetings/weekly/registrations/:id", requirePlatformUser, ctrl.patchRegistration);

  app.use("/api", router);
};
