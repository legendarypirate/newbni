"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/site-settings.controller");
  const router = express.Router();

  router.get("/site-settings/:name", ctrl.getSettingByName);

  app.use("/api", router);
};

