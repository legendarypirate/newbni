"use strict";

module.exports = (app) => {
  const regions = require("../controllers/region.controller");
  const router = require("express").Router();

  router.get("/api/regions", regions.list);

  app.use(router);
};
