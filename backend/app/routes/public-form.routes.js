"use strict";

module.exports = (app) => {
  const express = require("express");
  const ctrl = require("../controllers/public-form.controller");
  const router = express.Router();

  router.get("/public/forms/:publicSlug", ctrl.getPublished);
  router.get("/public/trips/:tripId", ctrl.getPublicTripById);
  router.post("/public/forms/:publicSlug/responses", ctrl.postPublicFormResponseBySlug);
  router.get("/public/trips/:tripId/registration", ctrl.getPublicTripRegistration);
  router.post("/public/trips/:tripId/registration", ctrl.postPublicTripRegistration);
  router.get("/public/events/:eventId/registration", ctrl.getPublicEventRegistration);
  router.post("/public/events/:eventId/registration", ctrl.postPublicEventRegistration);

  app.use("/api", router);
};
