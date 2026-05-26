"use strict";

const { resolvePlatformUser } = require("./require-platform-user");

/** Sets `req.platformUser` when JWT or platform cookies resolve; otherwise null. */
module.exports = async function optionalPlatformUser(req, res, next) {
  try {
    req.platformUser = (await resolvePlatformUser(req)) || null;
    next();
  } catch (err) {
    next(err);
  }
};
