"use strict";

const { getApiPlatformUser } = require("../utils/platform-user");

/**
 * Sets `req.platformUser` when session cookies resolve to an active account.
 */
async function requirePlatformUser(req, res, next) {
  try {
    const user = await getApiPlatformUser(req);
    if (!user) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    req.platformUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requirePlatformUser };
