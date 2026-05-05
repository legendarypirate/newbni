"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/home.controller");
  const router = express.Router();

  router.get("/home", ctrl.getHome);

  app.use("/api", router);
};

