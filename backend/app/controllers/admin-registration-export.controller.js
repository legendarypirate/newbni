"use strict";

const db = require("../models");

function csvEscape(cell) {
  const s = String(cell);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function isRecord(x) {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function formatOrderSummaryMn(raw) {
  if (!isRecord(raw)) return "";
  const lines = raw.lines;
  if (!Array.isArray(lines)) return "";
  const totalPax = Number(raw.totalPax ?? 0);
  const totalMnt = Number(raw.totalMnt ?? 0);
  const dep = String(raw.departureIso ?? "").trim();
  const parts = [];
  if (dep) parts.push(`Эхлэх: ${dep}`);
  parts.push(`Нийт: ${totalPax} хүн · ${Math.round(totalMnt).toLocaleString("mn-MN")} ₮`);
  for (const row of lines) {
    if (!isRecord(row)) continue;
    const label = String(row.label ?? "").trim() || String(row.tierId ?? "");
    const qty = Math.round(Number(row.qty ?? 0)) || 0;
    const unit = Math.round(Number(row.unitPriceMnt ?? 0)) || 0;
    if (qty > 0) parts.push(`  · ${label} × ${qty} — ${unit.toLocaleString("mn-MN")} ₮`);
  }
  return parts.join("\n");
}

function parseAnswersSnapshot(raw) {
  if (raw == null || !Array.isArray(raw)) return null;
  const out = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const questionId = typeof item.questionId === "string" ? item.questionId.trim() : "";
    if (!questionId) continue;
    out.push({
      questionId,
      label: typeof item.label === "string" ? item.label : "",
      value: typeof item.value === "string" || item.value === null ? item.value : null,
      fileUrl: typeof item.fileUrl === "string" || item.fileUrl === null ? item.fileUrl : null,
    });
  }
  return out.length > 0 ? out : null;
}

async function buildTripFormResponsesCsvFromFormId(formId) {
  const form = await db.TripRegistrationForm.findByPk(formId, {
    include: [
      {
        model: db.BusinessTrip,
        as: "trip",
        attributes: ["id", "destination", "startDate", "endDate", "coverImageUrl"],
        required: false,
      },
      {
        model: db.BniEvent,
        as: "event",
        attributes: ["id", "title", "startsAt", "endsAt"],
        required: false,
      },
    ],
  });

  if (!form) {
    const e = new Error("NOT_FOUND");
    e.status = 404;
    throw e;
  }

  const questions = await db.TripFormQuestion.findAll({
    where: { formId, retiredFromForm: false },
    order: [["sortOrder", "ASC"]],
  });
  const responses = await db.TripFormResponse.findAll({
    where: { formId },
    order: [["submittedAt", "ASC"]],
    include: [{ model: db.TripFormResponseAnswer, as: "answers", required: false }],
  });

  const cols = questions.map((q) => ({ key: `q:${q.id}`, header: q.label }));
  const seenCol = new Set(cols.map((c) => c.key));
  for (const r of responses) {
    const snap = parseAnswersSnapshot(r.answersSnapshot);
    if (!snap) continue;
    for (const s of snap) {
      const key = `q:${s.questionId}`;
      if (!seenCol.has(key)) {
        seenCol.add(key);
        cols.push({ key, header: s.label });
      }
    }
  }

  const headers = [
    "response_id",
    "submitted_at",
    "workflow_status",
    "payment_status",
    "order_summary",
    ...cols.map((c) => c.header),
  ];
  const lines = [headers.map(csvEscape).join(",")];

  for (const r of responses) {
    const answers = r.answers || [];
    const byQ = new Map(answers.map((a) => [a.questionId, (a.value ?? "").replace(/\r\n/g, "\n")]));
    const fileByQ = new Map(answers.map((a) => [a.questionId, a.fileUrl ?? ""]));
    const snap = parseAnswersSnapshot(r.answersSnapshot);
    const snapById = new Map((snap ?? []).map((s) => [s.questionId, s]));
    const cells = [
      r.id,
      r.submittedAt instanceof Date ? r.submittedAt.toISOString() : String(r.submittedAt),
      r.status,
      r.paymentStatus,
      formatOrderSummaryMn(r.orderSummary).replace(/\n/g, " | "),
      ...cols.map(({ key }) => {
        const qid = key.slice(2);
        const t = (byQ.get(qid) ?? (snapById.get(qid)?.value ?? "")).trim();
        const f = (fileByQ.get(qid) ?? (snapById.get(qid)?.fileUrl ?? "")).trim();
        if (f) return t ? `${t} | ${f}` : f;
        return t;
      }),
    ];
    lines.push(cells.map((c) => csvEscape(String(c))).join(","));
  }

  const safeTitle = String(form.title || "")
    .replace(/[^\w\u0400-\u04FF]+/g, "_")
    .slice(0, 60) || "responses";
  return { filename: `${safeTitle}_hariultuud.csv`, body: "\uFEFF" + lines.join("\n") };
}

exports.tripCsv = async (req, res) => {
  try {
    const tripId = Math.max(0, Number.parseInt(String(req.params.tripId || "0"), 10));
    if (!Number.isFinite(tripId) || tripId < 1) {
      return res.status(400).json({ error: "bad_trip_id" });
    }
    const published = await db.TripRegistrationForm.findOne({
      where: { tripId, isPublished: true },
      attributes: ["id"],
    });
    const fallback = await db.TripRegistrationForm.findOne({
      where: { tripId },
      order: [["updatedAt", "DESC"]],
      attributes: ["id"],
    });
    const formRef = published || fallback;
    if (!formRef) {
      return res.status(404).json({ error: "not_found" });
    }
    const { body } = await buildTripFormResponsesCsvFromFormId(formRef.id);
    const trip = await db.BusinessTrip.findByPk(tripId, { attributes: ["destination"] });
    const slug = String(trip?.destination?.trim() || `trip_${tripId}`)
      .replace(/[^\w\u0400-\u04FF]+/g, "_")
      .slice(0, 50);
    const filename = `${slug}_trip${tripId}_hariultuud.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store");
    return res.send(body);
  } catch (e) {
    const st = e.status || 500;
    return res.status(st).json({ error: "failed" });
  }
};

exports.eventCsv = async (req, res) => {
  try {
    const raw = String(req.params.eventId || "").trim();
    const eventIdNum = Number.parseInt(raw, 10);
    if (!Number.isFinite(eventIdNum) || eventIdNum < 1) {
      return res.status(400).json({ error: "bad_event_id" });
    }
    const published = await db.TripRegistrationForm.findOne({
      where: { eventId: eventIdNum, isPublished: true },
      attributes: ["id"],
    });
    const fallback = await db.TripRegistrationForm.findOne({
      where: { eventId: eventIdNum },
      order: [["updatedAt", "DESC"]],
      attributes: ["id"],
    });
    const formRef = published || fallback;
    if (!formRef) {
      return res.status(404).json({ error: "not_found" });
    }
    const { body } = await buildTripFormResponsesCsvFromFormId(formRef.id);
    const ev = await db.BniEvent.findByPk(eventIdNum, { attributes: ["title"] });
    const idStr = String(eventIdNum);
    const slug = String(ev?.title?.trim() || `event_${idStr}`)
      .replace(/[^\w\u0400-\u04FF]+/g, "_")
      .slice(0, 50);
    const filename = `${slug}_event${idStr}_hariultuud.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store");
    return res.send(body);
  } catch (e) {
    const st = e.status || 500;
    return res.status(st).json({ error: "failed" });
  }
};
