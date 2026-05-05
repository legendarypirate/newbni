"use strict";

const crypto = require("crypto");
const db = require("../models");

function parseYmdToUtcDate(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd).trim());
  if (!m) throw new Error("BAD_DATE");
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(Date.UTC(y, mo - 1, d));
}

function parseHhMmToTime(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm).trim());
  if (!m) throw new Error("BAD_TIME");
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(mi) || h > 23 || mi > 59) throw new Error("BAD_TIME");
  return new Date(Date.UTC(1970, 0, 1, h, mi, 0));
}

function createWeeklyMeetingPublicToken() {
  return crypto.randomBytes(16).toString("hex");
}

function canAccountCreateWeeklyMeeting(legacyRole) {
  return legacyRole !== "visitor";
}

async function listWeeklyMeetingsForOrganizer(organizerAccountId) {
  try {
    const rows = await db.BusyWeeklyMeeting.findAll({
      limit: 80,
      order: [
        ["meetingDate", "DESC"],
        ["startTime", "DESC"],
      ],
      include: [
        {
          model: db.BusyMeetingGroup,
          as: "group",
          required: true,
          where: { organizerAccountId },
        },
      ],
    });
    const meetings = [];
    for (const m of rows) {
      const registrationCount = await db.BusyMeetingRegistration.count({
        where: { weeklyMeetingId: m.id },
      });
      const plain = m.get({ plain: true });
      plain._count = { registrations: registrationCount };
      meetings.push(plain);
    }
    return meetings;
  } catch {
    return [];
  }
}

async function createWeeklyMeetingForAccount(accountId, input) {
  const groupName = String(input.groupName || "").trim();
  if (groupName.length < 2) throw new Error("GROUP_NAME");

  const anyRegChannel =
    (input.enableMemberRegistration ?? false) ||
    (input.enableGuestRegistration ?? false) ||
    (input.enableSubstituteRegistration ?? false);
  if (!anyRegChannel) throw new Error("NO_REG_CHANNEL");

  const meetingDate = parseYmdToUtcDate(input.meetingDateYmd);
  const startTime = parseHhMmToTime(input.startTimeHhMm);
  const endTime = input.endTimeHhMm?.trim() ? parseHhMmToTime(input.endTimeHhMm) : null;

  const fee =
    input.feeMnt === null || input.feeMnt === undefined || Number.isNaN(Number(input.feeMnt))
      ? null
      : Number(input.feeMnt);

  const publicToken = createWeeklyMeetingPublicToken();

  const meeting = await db.sequelize.transaction(async (t) => {
    const group = await db.BusyMeetingGroup.create(
      {
        organizerAccountId: accountId,
        name: groupName,
      },
      { transaction: t },
    );
    const m = await db.BusyWeeklyMeeting.create(
      {
        groupId: group.id,
        publicToken,
        meetingDate,
        startTime,
        endTime,
        location: input.location?.trim() || null,
        feeMnt: fee,
        enableMemberRegistration: input.enableMemberRegistration ?? true,
        enableGuestRegistration: input.enableGuestRegistration ?? true,
        enableSubstituteRegistration: input.enableSubstituteRegistration ?? true,
        enableShortIntroduction: input.enableShortIntroduction ?? true,
        enablePaymentTracking: input.enablePaymentTracking ?? true,
      },
      { transaction: t },
    );
    await db.BusyAuditLog.create(
      {
        actorAccountId: accountId,
        action: "weekly_meeting.create",
        subjectType: "busy_weekly_meeting",
        subjectId: String(m.id),
        metadata: { groupId: String(group.id), publicToken },
      },
      { transaction: t },
    );
    return m;
  });

  return { meetingId: meeting.id, publicToken: meeting.publicToken };
}

module.exports = {
  listWeeklyMeetingsForOrganizer,
  createWeeklyMeetingForAccount,
  canAccountCreateWeeklyMeeting,
};
