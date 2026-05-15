"use strict";

module.exports = (app) => {
  const ctrl = require("../../controllers/platform/news-platform.controller");
  const authMiddleware = require("../../middleware/auth.middleware");
  const router = require("express").Router();

  router.get("/news", authMiddleware, ctrl.listMine);
  router.get("/news/:id", authMiddleware, ctrl.getMine);
  router.post("/news", authMiddleware, ctrl.create);
  router.patch("/news/:id", authMiddleware, ctrl.update);
  router.delete("/news/:id", authMiddleware, ctrl.remove);

  app.use("/api/platform", router);
};
