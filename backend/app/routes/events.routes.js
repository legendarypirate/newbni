"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/events.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const router = express.Router();

  router.get("/events", ctrl.listPublic);
  router.get("/events/:id", ctrl.getById);
  router.post("/events", authMiddleware, ctrl.upsert);
  router.delete("/events/:id", authMiddleware, ctrl.remove);

  app.use("/api", router);
};
