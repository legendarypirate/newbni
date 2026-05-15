"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/events.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const router = express.Router();

  router.get("/events", ctrl.listPublic);
  router.get("/events/:id", ctrl.getById);
  router.get("/events/:id/registration-form-meta", authMiddleware, ctrl.registrationFormMeta);
  router.post("/events", authMiddleware, ctrl.upsert);
  router.patch("/events/:id", authMiddleware, ctrl.upsert);
  router.delete("/events/:id", authMiddleware, ctrl.remove);

  app.use("/api", router);
};
