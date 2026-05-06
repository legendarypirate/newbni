"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/payments.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const router = express.Router();

  router.get("/payments", authMiddleware, ctrl.list);

  app.use("/api", router);
};
