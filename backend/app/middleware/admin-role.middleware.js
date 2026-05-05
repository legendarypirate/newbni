"use strict";

/** JWT payload uses legacy Prisma enum string — managers use role `admin` in DB as well. */
module.exports = function requirePlatformAdminJwt(req, res, next) {
  const role = req.user?.role;
  if (role !== "admin") {
    return res.status(403).json({ ok: false, errorKey: "forbidden" });
  }
  next();
};
