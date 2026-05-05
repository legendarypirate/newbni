"use strict";

const { Op } = require("sequelize");
const db = require("../models");

/**
 * Mirrors PHP `bni_platform_upsert_from_google`: find by google_sub OR email,
 * update / create account + profile, return account with profile for display name.
 */
async function upsertPlatformAccountFromGoogle(payload) {
  const email = payload.email.trim().toLowerCase();
  if (!email) {
    throw new Error("Google profile must include an email.");
  }

  const googleId = payload.googleSub;
  const name = payload.name.trim();
  const picture = payload.picture.trim();
  const now = new Date();

  const existing = await db.PlatformAccount.findOne({
    where: {
      [Op.or]: [{ googleSub: googleId }, { email }],
    },
    include: [{ model: db.PlatformProfile, as: "profile", attributes: ["displayName", "photoUrl"] }],
  });

  if (existing) {
    if (existing.status !== "active") {
      throw new Error("account_inactive");
    }

    const displayName = name !== "" ? name : existing.email;
    const photoKeep = existing.profile?.photoUrl?.trim() ?? "";
    const photoUrl = picture !== "" ? picture : photoKeep || null;

    await existing.update({
      googleSub: googleId,
      email,
      lastLoginAt: now,
      updatedAt: now,
      updated_at: now,
    });

    const [profile] = await db.PlatformProfile.findOrCreate({
      where: { accountId: existing.id },
      defaults: {
        accountId: existing.id,
        displayName,
        photoUrl,
        updatedAt: now,
        updated_at: now,
      },
    });

    if (profile) {
      await profile.update({ displayName, photoUrl, updatedAt: now, updated_at: now });
    }

    return db.PlatformAccount.findByPk(existing.id, {
      include: [{ model: db.PlatformProfile, as: "profile", attributes: ["displayName"] }],
    });
  }

  const account = await db.PlatformAccount.create({
    email,
    googleSub: googleId,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
    created_at: now,
    updated_at: now,
  });

  await db.PlatformProfile.create({
    accountId: account.id,
    displayName: name !== "" ? name : email,
    photoUrl: picture !== "" ? picture : null,
    updatedAt: now,
    updated_at: now,
  });

  return db.PlatformAccount.findByPk(account.id, {
    include: [{ model: db.PlatformProfile, as: "profile", attributes: ["displayName"] }],
  });
}

module.exports = { upsertPlatformAccountFromGoogle };
