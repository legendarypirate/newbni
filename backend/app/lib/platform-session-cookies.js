"use strict";

const platformSessionMaxAgeSeconds = () => 60 * 60 * 24 * 30; // 30 days

const secureCookie = process.env.NODE_ENV === "production";

function parsePlatformSessionCookieDomainHost() {
  const raw = process.env.PLATFORM_SESSION_COOKIE_DOMAIN?.trim();
  if (!raw || raw.includes("://")) return undefined;
  const withoutDot = raw.startsWith(".") ? raw.slice(1) : raw;
  const hostOnly = withoutDot.split(":")[0]?.trim();
  if (!hostOnly || hostOnly.includes("/") || hostOnly.includes(" ")) return undefined;
  return hostOnly;
}

const platformSessionCookieDomain = parsePlatformSessionCookieDomainHost();

function domainOpts() {
  if (!platformSessionCookieDomain) return {};
  return { domain: `.${platformSessionCookieDomain}`.replace(/^\.+/, ".") };
}

function sessionCookieOpts() {
  return {
    path: "/",
    maxAge: platformSessionMaxAgeSeconds() * 1000, // Express maxAge is in ms
    sameSite: "lax",
    secure: secureCookie,
    ...domainOpts(),
  };
}

const googleOAuthCookieBase = {
  path: "/",
  sameSite: "lax",
  secure: secureCookie,
  ...domainOpts(),
};

function attachPlatformSessionToResponse(res, accountId, display) {
  const idStr = String(accountId);
  const so = sessionCookieOpts();
  res.cookie("bni_platform_account_id", idStr, { ...so, httpOnly: true });
  res.cookie("bni_platform_account_ref", idStr, { ...so, httpOnly: false });
  res.cookie("bni_platform_nav_display", display, { ...so, httpOnly: false });
}

function attachClearPlatformSessionToResponse(res) {
  const clearOpts = { ...sessionCookieOpts(), maxAge: 0 };
  res.cookie("bni_platform_account_id", "", { ...clearOpts, httpOnly: true });
  res.cookie("bni_platform_account_ref", "", { ...clearOpts, httpOnly: false });
  res.cookie("bni_platform_nav_display", "", { ...clearOpts, httpOnly: false });
}

function readCookieValueFromHeader(cookieHeader, name) {
  if (!cookieHeader) return undefined;
  for (const seg of cookieHeader.split(";")) {
    const trimmed = seg.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const k = trimmed.slice(0, eq).trim();
    if (k !== name) continue;
    let v = trimmed.slice(eq + 1).trim();
    if (v.startsWith('"') && v.endsWith('"') && v.length >= 2) {
      v = v.slice(1, -1);
    }
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  }
  return undefined;
}

module.exports = {
  attachPlatformSessionToResponse,
  attachClearPlatformSessionToResponse,
  readCookieValueFromHeader,
  googleOAuthCookieBase,
};
