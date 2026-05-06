"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/legacy-meetings.controller");
  const router = express.Router();

  router.get("/legacy-meetings", ctrl.list);
  router.get("/legacy-meetings/:id", ctrl.getById);

  app.use("/api", router);
};
