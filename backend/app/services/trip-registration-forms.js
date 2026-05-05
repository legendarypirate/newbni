"use strict";

const crypto = require("crypto");
const db = require("../models");
const { assertTripEditableByAccount, assertFormEditableByAccount, httpError } = require("./trip-registration-access");

const MVP_TRIP_FORM_QUESTION_TYPES = new Set([
  "SHORT_TEXT",
  "LONG_TEXT",
  "MULTIPLE_CHOICE",
  "CHECKBOXES",
  "DROPDOWN",
  "DATE",
  "PHONE",
  "EMAIL",
  "FILE_UPLOAD",
  "NUMBER",
]);

function newTripFormPublicSlug() {
  return `t${crypto.randomBytes(9).toString("base64url").replace(/=/g, "")}`;
}

function newCuidLikeId() {
  return crypto.randomUUID();
}

function defaultBusinessTripRegistrationQuestions() {
  return [
    { label: "Бүтэн нэр", type: "SHORT_TEXT", isRequired: true, placeholder: "Овог нэр" },
    { label: "Утасны дугаар", type: "PHONE", isRequired: true },
    { label: "Имэйл хаяг", type: "EMAIL", isRequired: true },
    { label: "Компанийн нэр", type: "SHORT_TEXT", isRequired: true },
    { label: "Албан тушаал", type: "SHORT_TEXT", isRequired: false },
    { label: "Үйл ажиллагааны чиглэл / салбар", type: "SHORT_TEXT", isRequired: false },
    {
      label: "Энэ аялалд оролцох гол зорилго",
      type: "LONG_TEXT",
      isRequired: true,
      placeholder: "Товчхон бичнэ үү",
    },
    {
      label: "Төлбөрийн баримт (хэрэв шаардлагатай бол)",
      type: "FILE_UPLOAD",
      isRequired: false,
    },
  ];
}

function assertMvpQuestionType(type) {
  if (!MVP_TRIP_FORM_QUESTION_TYPES.has(type)) {
    throw httpError(400, "UNSUPPORTED_TYPE");
  }
}

async function listTripFormsForOrganizer(tripId, accountId) {
  await assertTripEditableByAccount(tripId, accountId);
  const forms = await db.TripRegistrationForm.findAll({
    where: { tripId },
    order: [["updatedAt", "DESC"]],
  });
  const out = [];
  for (const f of forms) {
    const responseCount = await db.TripFormResponse.count({ where: { formId: f.id } });
    const questionCount = await db.TripFormQuestion.count({
      where: { formId: f.id, retiredFromForm: false },
    });
    out.push({
      id: f.id,
      title: f.title,
      publicSlug: f.publicSlug,
      isPublished: f.isPublished,
      updatedAt: f.updatedAt,
      _count: { responses: responseCount, questions: questionCount },
    });
  }
  return out;
}

async function loadFormQuestionsOrdered(formId) {
  return db.TripFormQuestion.findAll({
    where: { formId, retiredFromForm: false },
    order: [["sortOrder", "ASC"]],
    include: [
    {
      model: db.TripFormQuestionOption,
      as: "options",
      separate: true,
      order: [["sortOrder", "ASC"]],
    },
  ],
  });
}

async function getTripFormForOrganizer(formId, accountId) {
  await assertFormEditableByAccount(formId, accountId);
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
  if (!form) return null;
  const questions = await loadFormQuestionsOrdered(formId);
  form.setDataValue("questions", questions);
  return form;
}

async function patchTripRegistrationForm(formId, accountId, data) {
  await assertFormEditableByAccount(formId, accountId);
  const patch = {};
  if (data.title !== undefined) {
    patch.title = String(data.title).trim() || "Бүртгэлийн хураангуй";
  }
  if (data.description !== undefined) {
    patch.description = data.description === null ? null : String(data.description).trim() || null;
  }
  await db.TripRegistrationForm.update(patch, { where: { id: formId } });
}

async function deleteTripRegistrationForm(formId, accountId) {
  await assertFormEditableByAccount(formId, accountId);
  await db.TripRegistrationForm.destroy({ where: { id: formId } });
}

async function createTripRegistrationFormWithDefaults(input) {
  await assertTripEditableByAccount(input.tripId, input.actorAccountId);

  let publicSlug = newTripFormPublicSlug();
  for (let i = 0; i < 5; i++) {
    const clash = await db.TripRegistrationForm.findOne({
      where: { publicSlug },
      attributes: ["id"],
    });
    if (!clash) break;
    publicSlug = newTripFormPublicSlug();
  }

  const seeds = defaultBusinessTripRegistrationQuestions();
  const formId = newCuidLikeId();

  await db.sequelize.transaction(async (t) => {
    await db.TripRegistrationForm.create(
      {
        id: formId,
        tripId: input.tripId,
        title: String(input.title || "").trim() || "Бүртгэлийн хураангуй",
        description: input.description != null ? String(input.description).trim() || null : null,
        publicSlug,
        isPublished: false,
        settings: {
          thankYouMn:
            "Таны бүртгэл амжилттай илгээгдлээ. Зохион байгуулагч таны мэдээллийг шалгаж баталгаажуулна.",
        },
      },
      { transaction: t },
    );

    let order = 0;
    for (const q of seeds) {
      const qid = newCuidLikeId();
      await db.TripFormQuestion.create(
        {
          id: qid,
          formId,
          label: q.label,
          description: q.description ?? null,
          type: q.type,
          placeholder: q.placeholder ?? null,
          isRequired: q.isRequired,
          sortOrder: order++,
        },
        { transaction: t },
      );
      if (q.options?.length) {
        let o = 0;
        for (const opt of q.options) {
          await db.TripFormQuestionOption.create(
            {
              id: newCuidLikeId(),
              questionId: qid,
              label: opt.label,
              value: opt.value,
              sortOrder: o++,
            },
            { transaction: t },
          );
        }
      }
    }
  });

  return { formId, publicSlug };
}

async function addTripFormQuestion(formId, accountId, input) {
  await assertFormEditableByAccount(formId, accountId);
  assertMvpQuestionType(input.type);

  const needsOptions =
    input.type === "MULTIPLE_CHOICE" || input.type === "CHECKBOXES" || input.type === "DROPDOWN";
  if (needsOptions && (!input.options || input.options.length < 1)) {
    throw httpError(400, "OPTIONS_REQUIRED");
  }

  const last = await db.TripFormQuestion.findOne({
    where: { formId, retiredFromForm: false },
    order: [["sortOrder", "DESC"]],
    attributes: ["sortOrder"],
  });
  const sortOrder = (last?.sortOrder ?? -1) + 1;

  let created;
  await db.sequelize.transaction(async (transaction) => {
    const qid = newCuidLikeId();
    created = await db.TripFormQuestion.create(
      {
        id: qid,
        formId,
        label: String(input.label || "").trim() || "Асуулт",
        description: input.description != null ? String(input.description).trim() || null : null,
        type: input.type,
        placeholder: input.placeholder != null ? String(input.placeholder).trim() || null : null,
        isRequired: input.isRequired ?? false,
        sortOrder,
      },
      { transaction },
    );
    if (input.options?.length) {
      let o = 0;
      for (const opt of input.options) {
        await db.TripFormQuestionOption.create(
          {
            id: newCuidLikeId(),
            questionId: qid,
            label: String(opt.label || "").trim() || String(opt.value || "").trim(),
            value: String(opt.value || "").trim() || String(opt.label || "").trim(),
            sortOrder: o++,
          },
          { transaction },
        );
      }
    }
  });

  return created;
}

async function getPublishedFormBundleBySlug(publicSlug) {
  const form = await db.TripRegistrationForm.findOne({
    where: { publicSlug, isPublished: true },
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
  if (!form) return null;
  const questions = await loadFormQuestionsOrdered(form.id);
  form.setDataValue("questions", questions);
  return form;
}

module.exports = {
  listTripFormsForOrganizer,
  getTripFormForOrganizer,
  patchTripRegistrationForm,
  deleteTripRegistrationForm,
  createTripRegistrationFormWithDefaults,
  addTripFormQuestion,
  getPublishedFormBundleBySlug,
};
