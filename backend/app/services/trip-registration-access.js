"use strict";

const db = require("../models");

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

async function assertTripEditableByAccount(tripId, accountId) {
  const trip = await db.BusinessTrip.findByPk(tripId, {
    attributes: ["id", "managerAccountId"],
  });
  if (!trip) throw httpError(404, "NOT_FOUND");

  const mgr = trip.managerAccountId;
  const aid = typeof accountId === "bigint" ? accountId : BigInt(accountId);
  if (mgr != null && BigInt(mgr) !== aid) {
    const acc = await db.PlatformAccount.findByPk(accountId, { attributes: ["role"] });
    if (!acc || (acc.role !== "admin" && acc.role !== "director")) {
      throw httpError(403, "FORBIDDEN");
    }
  }
}

/** Mirrors frontend `service.ts`: admin/director gate for event-linked forms (MVP). */
async function assertEventFormEditableByAccount(_eventId, accountId) {
  const acc = await db.PlatformAccount.findByPk(accountId, {
    attributes: ["role", "status"],
  });
  if (!acc || acc.status !== "active") throw httpError(403, "FORBIDDEN");
  if (acc.role === "admin" || acc.role === "director") return;
  throw httpError(403, "FORBIDDEN");
}

async function assertFormEditableByAccount(formId, accountId) {
  const form = await db.TripRegistrationForm.findByPk(formId, {
    attributes: ["id", "tripId", "eventId"],
  });
  if (!form) throw httpError(404, "NOT_FOUND");
  if (form.tripId != null) {
    await assertTripEditableByAccount(form.tripId, accountId);
    return { tripId: form.tripId, eventId: null };
  }
  if (form.eventId != null) {
    await assertEventFormEditableByAccount(form.eventId, accountId);
    return { tripId: null, eventId: form.eventId };
  }
  throw httpError(400, "INVALID_FORM");
}

module.exports = {
  assertTripEditableByAccount,
  assertEventFormEditableByAccount,
  assertFormEditableByAccount,
  httpError,
};
