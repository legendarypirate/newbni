"use strict";

/** Trip `status_label` values used for admin approval workflow. */
const TRIP_STATUS = {
  DRAFT: "Ноорог",
  PENDING: "Хүлээгдэж байна",
  APPROVED: "Нийтлэгдсэн",
  REJECTED: "Татгалзсан",
};

/** Event detail envelope key (stored in `curriculum_override_json`). */
const EVENT_APPROVAL_KEY = "approval_status";

const EVENT_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  PUBLISHED: "published",
  REJECTED: "rejected",
};

function isAdminUser(user) {
  return user?.role === "admin" || user?.isAdmin === true;
}

function normalizeTripStatusLabel(raw) {
  const v = String(raw || "").trim();
  if (v === TRIP_STATUS.APPROVED) return TRIP_STATUS.APPROVED;
  if (v === TRIP_STATUS.REJECTED) return TRIP_STATUS.REJECTED;
  if (v === TRIP_STATUS.PENDING) return TRIP_STATUS.PENDING;
  return TRIP_STATUS.DRAFT;
}

function tripStatusForPublic() {
  return TRIP_STATUS.APPROVED;
}

function readEventApprovalStatus(envelope) {
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
    return EVENT_STATUS.DRAFT;
  }
  const v = String(envelope[EVENT_APPROVAL_KEY] || "").trim().toLowerCase();
  if (v === EVENT_STATUS.PUBLISHED) return EVENT_STATUS.PUBLISHED;
  if (v === EVENT_STATUS.PENDING) return EVENT_STATUS.PENDING;
  if (v === EVENT_STATUS.REJECTED) return EVENT_STATUS.REJECTED;
  return EVENT_STATUS.DRAFT;
}

function mergeEventApprovalStatus(envelope, status) {
  const base =
    envelope && typeof envelope === "object" && !Array.isArray(envelope)
      ? { ...envelope }
      : {};
  base[EVENT_APPROVAL_KEY] = status;
  return base;
}

function tripStatusBadgeMn(statusLabel) {
  const s = normalizeTripStatusLabel(statusLabel);
  if (s === TRIP_STATUS.APPROVED) return "Зөвшөөрсөн";
  if (s === TRIP_STATUS.REJECTED) return "Татгалзсан";
  if (s === TRIP_STATUS.PENDING) return "Хүлээгдэж байна";
  return "Ноорог";
}

function eventStatusBadgeMn(status) {
  if (status === EVENT_STATUS.PUBLISHED) return "Зөвшөөрсөн";
  if (status === EVENT_STATUS.REJECTED) return "Татгалзсан";
  if (status === EVENT_STATUS.PENDING) return "Хүлээгдэж байна";
  return "Ноорог";
}

module.exports = {
  TRIP_STATUS,
  EVENT_STATUS,
  EVENT_APPROVAL_KEY,
  isAdminUser,
  normalizeTripStatusLabel,
  tripStatusForPublic,
  readEventApprovalStatus,
  mergeEventApprovalStatus,
  tripStatusBadgeMn,
  eventStatusBadgeMn,
};
