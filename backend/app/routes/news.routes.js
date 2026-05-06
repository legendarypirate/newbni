"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/news.controller");
  const router = express.Router();

  router.get("/news", ctrl.list);
  router.get("/news/:id", ctrl.getById);

  app.use("/api", router);
};
