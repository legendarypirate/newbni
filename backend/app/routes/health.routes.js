"use strict";

module.exports = (app) => {
  const health = require("../controllers/health.controller");
  const router = require("express").Router();

  router.get("/", health.root);
  router.get("/health", health.healthCheck);
  router.get("/api/health/db", health.dbHealthCheck);

  app.use(router);
};
