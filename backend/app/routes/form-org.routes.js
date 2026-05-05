"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/form-org.controller");
  const { requirePlatformUser } = require("../middleware/require-platform-user");
  const router = express.Router();

  router.get("/forms/:formId", requirePlatformUser, ctrl.get);
  router.patch("/forms/:formId", requirePlatformUser, ctrl.patch);
  router.delete("/forms/:formId", requirePlatformUser, ctrl.delete);
  router.post("/forms/:formId/questions", requirePlatformUser, ctrl.addQuestion);

  app.use("/api", router);
};
