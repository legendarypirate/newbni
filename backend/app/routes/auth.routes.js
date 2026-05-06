"use strict";

module.exports = (app) => {
  const auth = require("../controllers/auth.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const router = require("express").Router();

  router.get("/google", auth.googleStart);
  router.get("/google/callback", auth.googleCallback);
  router.post("/login", auth.passwordLogin);
  router.post("/admin/login", auth.adminPasswordLogin);
  router.post("/register", auth.passwordRegister);
  router.get("/me", authMiddleware, auth.me);

  app.use("/api/auth", router);
};
