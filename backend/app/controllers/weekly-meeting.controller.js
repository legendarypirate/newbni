"use strict";

const {
  listWeeklyMeetingsForOrganizer,
  createWeeklyMeetingForAccount,
  canAccountCreateWeeklyMeeting,
} = require("../services/weekly-meeting");

function meetingDateIso(d) {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString();
  return String(d);
}

function timeIso(t) {
  if (t == null) return null;
  if (t instanceof Date) return t.toISOString();
  if (typeof t === "string" && /^\d{1,2}:\d{2}/.test(t)) {
    const [hh, mm, rest] = t.split(":");
    const sec = rest ? Number.parseInt(rest, 10) || 0 : 0;
    return new Date(Date.UTC(1970, 0, 1, Number(hh), Number(mm), sec)).toISOString();
  }
  return String(t);
}

exports.list = async (req, res) => {
  const list = await listWeeklyMeetingsForOrganizer(req.platformUser.id);
  res.json({
    meetings: list.map((m) => ({
      id: String(m.id),
      publicToken: m.publicToken,
      groupName: m.group.name,
      meetingDate: meetingDateIso(m.meetingDate),
      startTime: timeIso(m.startTime),
      endTime: timeIso(m.endTime),
      location: m.location,
      registrationCount: m._count.registrations,
    })),
  });
};

exports.create = async (req, res) => {
  if (!canAccountCreateWeeklyMeeting(req.platformUser.legacyRole)) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  const body = req.body || {};
  try {
    const created = await createWeeklyMeetingForAccount(req.platformUser.id, body);
    res.json({
      ok: true,
      meetingId: String(created.meetingId),
      publicToken: created.publicToken,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    res.status(400).json({ error: msg });
  }
};
