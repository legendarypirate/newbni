"use strict";

const db = require("../models");
const { readCookieValueFromHeader } = require("./cookies");

const PLATFORM_ACCOUNT_REF_COOKIE = "bni_platform_account_ref";

function parseAccountId(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    return BigInt(raw.trim());
  } catch {
    return null;
  }
}

function resolveAccountIdFromReq(req) {
  const raw = req.headers.cookie;
  const fromHeader =
    parseAccountId(readCookieValueFromHeader(raw, "bni_platform_account_id")) ??
    parseAccountId(readCookieValueFromHeader(raw, PLATFORM_ACCOUNT_REF_COOKIE));
  return fromHeader;
}

/**
 * Same cookie resolution as Next `getApiPlatformUser`.
 * @returns {Promise<{ id: bigint; email: string; displayName: string; legacyRole: string } | null>}
 */
async function getApiPlatformUser(req) {
  const id = resolveAccountIdFromReq(req);
  if (!id) return null;

  let account;
  try {
    account = await db.PlatformAccount.findByPk(id, {
      include: [{ model: db.PlatformProfile, as: "profile", required: false }],
    });
  } catch {
    return null;
  }

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
}

module.exports = {
  getApiPlatformUser,
  PLATFORM_ACCOUNT_REF_COOKIE,
};
