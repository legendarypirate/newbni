"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/events.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const optionalPlatformUser = require("../middleware/optional-platform-user.middleware");
  const router = express.Router();

  router.get("/events", optionalPlatformUser, ctrl.listPublic);
  router.get("/events/:id", optionalPlatformUser, ctrl.getById);
  router.get("/events/:id/registration-form-meta", authMiddleware, ctrl.registrationFormMeta);
  router.post("/events", authMiddleware, ctrl.upsert);
  router.patch("/events/:id", authMiddleware, ctrl.upsert);
  router.delete("/events/:id", authMiddleware, ctrl.remove);

  app.use("/api", router);
};
