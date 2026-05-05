"use strict";

const db = require("../models");
const crypto = require("crypto");

function stableLegacyQuestionId(name, index) {
  const t = (name || "").trim();
  if (t.length > 0) return t;
  return `legacy_q_${index}`;
}

function legacyStringToTripType(typeStr) {
  switch (typeStr) {
    case "textarea": return "LONG_TEXT";
    case "email": return "EMAIL";
    case "tel": return "PHONE";
    case "number": return "NUMBER";
    case "date": return "DATE";
    case "select": return "DROPDOWN";
    case "radio": return "MULTIPLE_CHOICE";
    case "checkbox": return "CHECKBOXES";
    default: return "SHORT_TEXT";
  }
}

function needsTripOptions(type) {
  return type === "MULTIPLE_CHOICE" || type === "CHECKBOXES" || type === "DROPDOWN";
}

function parseLegacyRegistrationArray(registration) {
  let v = registration;
  if (typeof v === "string" && v.trim()) {
    try { v = JSON.parse(v); } catch { return []; }
  }
  if (!Array.isArray(v)) return [];
  return v
    .filter(x => x !== null && typeof x === "object")
    .map(x => ({
      name: String(x.name ?? "").trim(),
      label: String(x.label ?? ""),
      type: String(x.type ?? "text"),
      required: Number(x.required ?? 0) ? 1 : 0,
      placeholder: String(x.placeholder ?? ""),
      options: Array.isArray(x.options) ? x.options.map(o => String(o)).filter(Boolean) : [],
    }));
}

async function syncTripRegistrationFormFromLegacyJson(tripId, registration) {
  const parsed = parseLegacyRegistrationArray(registration);
  const rows = parsed.filter(r => r.label.trim());

  if (rows.length === 0) {
    const forms = await db.TripRegistrationForm.findAll({ where: { tripId }, attributes: ["id"] });
    for (const f of forms) {
      const qs = await db.TripFormQuestion.findAll({ where: { formId: f.id }, attributes: ["id"] });
      for (const q of qs) {
        const cnt = await db.TripFormResponseAnswer.count({ where: { questionId: q.id } });
        if (cnt > 0) {
          await db.TripFormQuestion.update(
            { retiredFromForm: true, sortOrder: 999000 },
            { where: { id: q.id } }
          );
        } else {
          await db.TripFormQuestionOption.destroy({ where: { questionId: q.id } });
          await db.TripFormQuestion.destroy({ where: { id: q.id } });
        }
      }
      await db.TripRegistrationForm.update({ isPublished: false }, { where: { id: f.id } });
    }
    return;
  }

  const trip = await db.BusinessTrip.findByPk(tripId, { attributes: ["destination"] });
  if (!trip) return;

  const transaction = await db.sequelize.transaction();
  try {
    let form = await db.TripRegistrationForm.findOne({
      where: { tripId },
      order: [["createdAt", "ASC"]],
      transaction
    });

    if (!form) {
      const publicSlug = crypto.randomBytes(8).toString("hex");
      form = await db.TripRegistrationForm.create({
        tripId,
        title: trip.destination?.trim() || "Бүртгэлийн хураангуй",
        publicSlug,
        isPublished: true,
        settings: { thankYouMn: "Таны бүртгэл амжилттай илгээгдлээ." },
      }, { transaction });
    } else {
      await form.update({
        isPublished: true,
        title: trip.destination?.trim() || form.title,
      }, { transaction });
    }

    await db.TripRegistrationForm.update(
      { isPublished: false },
      { where: { tripId, id: { [db.Sequelize.Op.ne]: form.id } }, transaction }
    );

    // Upsert questions
    const desired = rows.map((row, idx) => ({
      id: stableLegacyQuestionId(row.name, idx),
      sortOrder: idx,
      row,
    }));
    const desiredIds = new Set(desired.map(d => d.id));

    const existing = await db.TripFormQuestion.findAll({
      where: { formId: form.id },
      attributes: ["id"],
      transaction
    });

    const answerQuestionRows = await db.TripFormResponseAnswer.findAll({
      include: [{
        model: db.TripFormResponse,
        as: "response",
        where: { formId: form.id },
        attributes: []
      }],
      attributes: ["questionId"],
      group: ["questionId"],
      transaction
    });
    const questionIdsWithAnswers = new Set(answerQuestionRows.map(r => r.questionId));

    for (const d of desired) {
      const row = d.row;
      const type = legacyStringToTripType(row.type);
      const isRequired = row.required === 1;

      const [qInst] = await db.TripFormQuestion.findOrCreate({
        where: { id: d.id },
        defaults: {
          id: d.id,
          formId: form.id,
          label: row.label.trim(),
          type,
          placeholder: row.placeholder.trim() || null,
          isRequired,
          sortOrder: d.sortOrder,
          retiredFromForm: false,
        },
        transaction
      });

      await qInst.update({
        formId: form.id,
        label: row.label.trim(),
        type,
        placeholder: row.placeholder.trim() || null,
        isRequired,
        sortOrder: d.sortOrder,
        retiredFromForm: false,
      }, { transaction });

      await db.TripFormQuestionOption.destroy({ where: { questionId: d.id }, transaction });
      if (needsTripOptions(type)) {
        const opts = row.options.length > 0 ? row.options : ["Сонголт 1", "Сонголт 2"];
        await db.TripFormQuestionOption.bulkCreate(
          opts.map((label, i) => ({
            questionId: d.id,
            label,
            value: label,
            sortOrder: i,
          })),
          { transaction }
        );
      }
    }

    let retireSeq = 0;
    for (const ex of existing) {
      if (desiredIds.has(ex.id)) continue;
      if (questionIdsWithAnswers.has(ex.id)) {
        await db.TripFormQuestion.update(
          { retiredFromForm: true, sortOrder: 900000 + retireSeq++ },
          { where: { id: ex.id }, transaction }
        );
      } else {
        await db.TripFormQuestionOption.destroy({ where: { questionId: ex.id }, transaction });
        await db.TripFormQuestion.destroy({ where: { id: ex.id }, transaction });
      }
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    console.error("Sync trip form failed:", err);
    throw err;
  }
}

module.exports = {
  stableLegacyQuestionId,
  parseLegacyRegistrationArray,
  syncTripRegistrationFormFromLegacyJson,
};
