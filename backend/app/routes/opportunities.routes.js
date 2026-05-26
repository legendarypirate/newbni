"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/opportunities.controller");
  const router = express.Router();

  router.get("/opportunities", ctrl.listPublic);
  router.get("/opportunities/:id", ctrl.getById);

  app.use("/api", router);
};
