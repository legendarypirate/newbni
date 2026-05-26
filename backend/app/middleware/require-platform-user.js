"use strict";

const jwt = require("jsonwebtoken");
const db = require("../models");
const { getApiPlatformUser } = require("../utils/platform-user");

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only";

async function platformUserFromJwt(req) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const id = decoded?.id;
    if (!id) return null;

    const account = await db.PlatformAccount.findByPk(id, {
      include: [{ model: db.PlatformProfile, as: "profile", required: false }],
    });
    if (!account || account.status !== "active") return null;

    const profile = account.profile;
    const display =
      profile && profile.displayName && profile.displayName.trim() !== ""
        ? profile.displayName.trim()
        : account.email;

    return {
      id: account.id,
      email: account.email,
      displayName: display,
      legacyRole: account.role,
    };
  } catch {
    return null;
  }
}

/**
 * Sets `req.platformUser` when session cookies or Bearer JWT resolve to an active account.
 */
async function requirePlatformUser(req, res, next) {
  try {
    const user = await resolvePlatformUser(req);
    if (!user) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    req.platformUser = user;
    req.user = req.user || {
      id: String(user.id),
      email: user.email,
      role: user.legacyRole,
      displayName: user.displayName,
      isAdmin: user.legacyRole === "admin",
    };
    next();
  } catch (err) {
    next(err);
  }
}

async function resolvePlatformUser(req) {
  let user = await platformUserFromJwt(req);
  if (!user) {
    user = await getApiPlatformUser(req);
  }
  return user;
}

module.exports = { requirePlatformUser, platformUserFromJwt, resolvePlatformUser };
