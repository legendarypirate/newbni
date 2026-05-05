"use strict";

function readCookieValueFromHeader(cookieHeader, name) {
  if (!cookieHeader || typeof cookieHeader !== "string") return undefined;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== name) continue;
    let val = trimmed.slice(eq + 1).trim();
    try {
      val = decodeURIComponent(val);
    } catch {
      /* keep raw */
    }
    return val;
  }
  return undefined;
}

module.exports = { readCookieValueFromHeader };
