"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/investments.controller");
  const router = express.Router();

  router.get("/investments", ctrl.listPublished);

  app.use("/api", router);
};
