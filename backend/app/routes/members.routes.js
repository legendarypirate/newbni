"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/members.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const router = express.Router();

  router.get("/members", ctrl.list);
  router.get("/members/:id", ctrl.getById);
  router.get("/profiles/:id", ctrl.getProfileByAccountId);
  router.post("/profiles/me", authMiddleware, ctrl.updateMyProfile);
  router.post("/profiles/me/hero-slides", authMiddleware, ctrl.updateMyHeroSlides);

  app.use("/api", router);
};
