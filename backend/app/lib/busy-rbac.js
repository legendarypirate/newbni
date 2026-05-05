"use strict";

const db = require("../models");

const BUSY_ROLE_SLUGS = {
  organizer: "organizer",
};

/**
 * Idempotent: gives active non-visitor accounts the `organizer` Busy role so `weekly_meeting.manage_own` applies.
 * Call after successful login (email + Google).
 */
async function ensureOrganizerRoleForEligibleAccount(accountId) {
  let acc;
  try {
    acc = await db.PlatformAccount.findByPk(accountId, { attributes: ["role"] });
  } catch (err) {
    console.error("RBAC: find account failed", err);
    return;
  }
  if (!acc || acc.role === "visitor") return;

  let organizerId;
  try {
    const organizer = await db.BusyRole.findOne({
      where: { slug: BUSY_ROLE_SLUGS.organizer },
      attributes: ["id"],
    });
    organizerId = organizer?.id;
  } catch (err) {
    console.error("RBAC: find role failed", err);
    return;
  }
  if (organizerId === undefined) return;

  try {
    await db.BusyUserRoleAssignment.findOrCreate({
      where: { accountId, roleId: organizerId },
      defaults: { accountId, roleId: organizerId },
    });
  } catch (err) {
    // console.error("RBAC: upsert failed", err);
  }
}

module.exports = {
  ensureOrganizerRoleForEligibleAccount,
};
