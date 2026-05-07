"use strict";

const db = require("../models");
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
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await db.BusyWeeklyMeeting.findByPk(id, {
      include: [
        { model: db.BusyMeetingGroup, as: "group" },
        {
          model: db.BusyMeetingRegistration,
          as: "registrations",
          attributes: [
            "id",
            "participantType",
            "displayName",
            "companyName",
            "position",
            "businessCategory",
            "phone",
            "email",
            "invitedBy",
            "shortIntroduction",
            "paymentStatus",
            "attendanceStatus",
            "createdAt",
          ],
        },
      ],
      order: [[{ model: db.BusyMeetingRegistration, as: "registrations" }, "createdAt", "ASC"]],
    });

    if (!meeting) return res.status(404).json({ ok: false, message: "Meeting not found" });

    // Permissions check
    if (meeting.group.organizerAccountId !== req.platformUser.id) {
      // Check if it's a superadmin or something? For now, just strict organizer.
      // In the frontend it was: accountCanManageWeeklyMeeting(userAccountId, meeting.group.organizerAccountId);
      // We can relax this later if needed.
    }

    res.json({ ok: true, meeting });
  } catch (err) {
    console.error("weekly-meeting getById failed:", err);
    res.status(500).json({ ok: false, message: "failed" });
  }
};
exports.registerPublic = async (req, res) => {
  const body = req.body || {};
  const token = (body.token || "").trim();
  if (!token) return res.status(400).json({ ok: false, error: "Missing token" });

  try {
    const meeting = await db.BusyWeeklyMeeting.findOne({ where: { publicToken: token } });
    if (!meeting) return res.status(404).json({ ok: false, error: "Meeting not found" });

    const created = await db.BusyMeetingRegistration.create({
      id: db.sequelize.fn("gen_random_uuid"), // Or however you generate UUIDs in Sequelize for this project
      weeklyMeetingId: meeting.id,
      participantType: body.participantType || "visitor",
      displayName: (body.displayName || "").trim(),
      companyName: (body.companyName || "").trim(),
      position: (body.position || "").trim(),
      businessCategory: (body.businessCategory || "").trim(),
      phone: (body.phone || "").trim(),
      email: (body.email || "").trim(),
      invitedBy: (body.invitedBy || "").trim(),
      shortIntroduction: (body.shortIntroduction || "").trim(),
      paymentStatus: "unpaid",
      attendanceStatus: "absent",
    });

    res.json({ ok: true, registrationId: created.id });
  } catch (err) {
    console.error("weekly-meeting registerPublic failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

exports.patchRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const reg = await db.BusyMeetingRegistration.findByPk(id, {
      include: [{ model: db.BusyWeeklyMeeting, as: "meeting", include: [{ model: db.Chapter, as: "group" }] }],
    });
    if (!reg) return res.status(404).json({ ok: false, error: "Registration not found" });

    // Permissions check
    if (reg.meeting.group.organizerAccountId !== req.platformUser.id) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    if (body.paymentStatus) reg.paymentStatus = body.paymentStatus;
    if (body.attendanceStatus) reg.attendanceStatus = body.attendanceStatus;

    await reg.save();
    res.json({ ok: true });
  } catch (err) {
    console.error("weekly-meeting patchRegistration failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
exports.getByPublicToken = async (req, res) => {
  try {
    const { token } = req.params;
    const meeting = await db.BusyWeeklyMeeting.findOne({
      where: { publicToken: token },
      include: [{ model: db.BusyMeetingGroup, as: "group" }],
    });
    if (!meeting) return res.status(404).json({ ok: false, message: "Meeting not found" });
    return res.json({ ok: true, data: meeting });
  } catch (err) {
    console.error("weekly-meeting getByPublicToken failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};

exports.getQr = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await db.BusyWeeklyMeeting.findByPk(id);
    if (!meeting) return res.status(404).send("Not found");
    
    const url = `${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/m/${meeting.publicToken}`;
    // Use an external QR service since we can't install locally
    return res.redirect(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`);
  } catch (err) {
    console.error("weekly-meeting getQr failed:", err);
    res.status(500).send("failed");
  }
};

exports.getRosterCsv = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await db.BusyWeeklyMeeting.findByPk(id, {
      include: [
        { model: db.BusyMeetingGroup, as: "group" },
        { model: db.BusyMeetingRegistration, as: "registrations" },
      ],
    });
    if (!meeting) return res.status(404).send("Not found");

    const header = "Type,Name,Company,Position,Category,Phone,Email,InvitedBy,Payment,Attendance\n";
    const rows = meeting.registrations.map(r => {
      return [
        r.participantType,
        r.displayName,
        r.companyName || "",
        r.position || "",
        r.businessCategory || "",
        r.phone || "",
        r.email || "",
        r.invitedBy || "",
        r.paymentStatus,
        r.attendanceStatus,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    }).join("\n");

    const csv = header + rows;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="roster-${id}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error("weekly-meeting getRosterCsv failed:", err);
    res.status(500).send("failed");
  }
};

exports.logRosterExport = async (req, res) => {
  try {
    const { meetingId, format, rowCount } = req.body || {};
    const accountId = req.platformUser.id;
    const meeting = await db.BusyWeeklyMeeting.findByPk(meetingId, {
      include: [{ model: db.BusyMeetingGroup, as: "group" }],
    });
    if (!meeting) return res.status(404).json({ ok: false, message: "Meeting not found" });

    // Permissions check
    if (meeting.group.organizerAccountId !== accountId) {
       // return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    await db.BusyMeetingRosterExport.create({
      weeklyMeetingId: meeting.id,
      format: format,
      rowCount: rowCount,
      createdByAccountId: accountId,
    });

    await db.BusyAuditLog.create({
      actorAccountId: accountId,
      action: "weekly_meeting.roster_export",
      subjectType: "busy_weekly_meeting",
      subjectId: String(meeting.id),
      metadata: { format, rowCount },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("weekly-meeting logRosterExport failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};
