"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/events.controller");
  const router = express.Router();

  router.get("/events", ctrl.listPublic);

  app.use("/api", router);
};
