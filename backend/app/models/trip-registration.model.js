"use strict";

/**
 * Trip/event registration forms + responses — maps `trip_registration_*`, `trip_form_*`,
 * `trip_participants`, `trip_payments` (Prisma @@map alignment).
 */
module.exports = function defineTripRegistrationModels(sequelize, DataTypes) {
  const tripQuestionTypeEnum = DataTypes.ENUM(
    "SHORT_TEXT",
    "LONG_TEXT",
    "MULTIPLE_CHOICE",
    "CHECKBOXES",
    "DROPDOWN",
    "DATE",
    "TIME",
    "PHONE",
    "EMAIL",
    "FILE_UPLOAD",
    "NUMBER",
    "YES_NO",
    "COUNTRY",
    "COMPANY_BLOCK",
    "EMERGENCY_CONTACT_BLOCK",
    "PAYMENT_CONFIRMATION_BLOCK",
  );

  const TripRegistrationForm = sequelize.define(
    "TripRegistrationForm",
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      tripId: { type: DataTypes.INTEGER, field: "trip_id", allowNull: true },
      eventId: { type: DataTypes.BIGINT, field: "event_id", allowNull: true },
      title: { type: DataTypes.STRING(512), allowNull: false },
      description: DataTypes.TEXT,
      publicSlug: { type: DataTypes.STRING(160), field: "public_slug", allowNull: false, unique: true },
      isPublished: { type: DataTypes.BOOLEAN, field: "is_published", allowNull: false, defaultValue: false },
      settings: { type: DataTypes.JSONB, allowNull: true },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false },
    },
    {
      tableName: "trip_registration_forms",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["trip_id"], name: "trip_registration_forms_trip_idx" },
        { fields: ["event_id"], name: "trip_registration_forms_event_idx" },
      ],
    },
  );

  const TripFormQuestion = sequelize.define(
    "TripFormQuestion",
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      formId: { type: DataTypes.STRING, field: "form_id", allowNull: false },
      label: { type: DataTypes.STRING(512), allowNull: false },
      description: DataTypes.TEXT,
      type: { type: tripQuestionTypeEnum, allowNull: false },
      placeholder: { type: DataTypes.STRING(512), allowNull: true },
      isRequired: { type: DataTypes.BOOLEAN, field: "is_required", allowNull: false, defaultValue: false },
      sortOrder: { type: DataTypes.INTEGER, field: "sort_order", allowNull: false, defaultValue: 0 },
      retiredFromForm: { type: DataTypes.BOOLEAN, field: "retired_from_form", allowNull: false, defaultValue: false },
      validationRules: { type: DataTypes.JSONB, field: "validation_rules", allowNull: true },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false },
    },
    {
      tableName: "trip_form_questions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ fields: ["form_id", "sort_order"], name: "trip_form_questions_form_sort_idx" }],
    },
  );

  const TripFormQuestionOption = sequelize.define(
    "TripFormQuestionOption",
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      questionId: { type: DataTypes.STRING, field: "question_id", allowNull: false },
      label: { type: DataTypes.STRING(512), allowNull: false },
      value: { type: DataTypes.STRING(512), allowNull: false },
      sortOrder: { type: DataTypes.INTEGER, field: "sort_order", allowNull: false, defaultValue: 0 },
    },
    {
      tableName: "trip_form_question_options",
      timestamps: false,
      indexes: [{ fields: ["question_id", "sort_order"], name: "trip_form_question_options_q_sort_idx" }],
    },
  );

  const TripFormResponse = sequelize.define(
    "TripFormResponse",
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      formId: { type: DataTypes.STRING, field: "form_id", allowNull: false },
      tripId: { type: DataTypes.INTEGER, field: "trip_id", allowNull: true },
      eventId: { type: DataTypes.BIGINT, field: "event_id", allowNull: true },
      submittedByUserId: { type: DataTypes.BIGINT, field: "submitted_by_user_id", allowNull: true },
      status: {
        type: DataTypes.ENUM("SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CONFIRMED", "CANCELLED"),
        allowNull: false,
        defaultValue: "SUBMITTED",
      },
      paymentStatus: {
        type: DataTypes.ENUM("UNPAID", "PENDING", "PAID", "EXEMPTED", "REFUNDED"),
        field: "payment_status",
        allowNull: false,
        defaultValue: "UNPAID",
      },
      orderSummary: { type: DataTypes.JSONB, field: "order_summary", allowNull: true },
      answersSnapshot: { type: DataTypes.JSONB, field: "answers_snapshot", allowNull: true },
      internalNote: { type: DataTypes.TEXT, field: "internal_note", allowNull: true },
      submittedAt: { type: DataTypes.DATE, field: "submitted_at", allowNull: false },
    },
    {
      tableName: "trip_form_responses",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["form_id"], name: "trip_form_responses_form_idx" },
        { fields: ["trip_id"], name: "trip_form_responses_trip_idx" },
        { fields: ["event_id"], name: "trip_form_responses_event_idx" },
      ],
    },
  );

  const TripFormResponseAnswer = sequelize.define(
    "TripFormResponseAnswer",
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      responseId: { type: DataTypes.STRING, field: "response_id", allowNull: false },
      questionId: { type: DataTypes.STRING, field: "question_id", allowNull: false },
      value: DataTypes.TEXT,
      fileUrl: { type: DataTypes.STRING(512), field: "file_url", allowNull: true },
    },
    {
      tableName: "trip_form_response_answers",
      timestamps: true,
      updatedAt: false,
      createdAt: "created_at",
      indexes: [
        { fields: ["response_id"], name: "trip_form_response_answers_resp_idx" },
        { fields: ["question_id"], name: "trip_form_response_answers_q_idx" },
      ],
    },
  );

  const TripParticipant = sequelize.define(
    "TripParticipant",
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      tripId: { type: DataTypes.INTEGER, field: "trip_id", allowNull: false },
      userId: { type: DataTypes.BIGINT, field: "user_id", allowNull: true },
      responseId: { type: DataTypes.STRING, field: "response_id", allowNull: true, unique: true },
      fullName: { type: DataTypes.STRING(255), field: "full_name", allowNull: false },
      phone: { type: DataTypes.STRING(64), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      companyName: { type: DataTypes.STRING(255), field: "company_name", allowNull: true },
      position: { type: DataTypes.STRING(255), allowNull: true },
      status: {
        type: DataTypes.ENUM("REGISTERED", "CONFIRMED", "CANCELLED"),
        allowNull: false,
        defaultValue: "REGISTERED",
      },
      paymentStatus: {
        type: DataTypes.ENUM("UNPAID", "PENDING", "PAID", "EXEMPTED", "REFUNDED"),
        field: "payment_status",
        allowNull: false,
        defaultValue: "UNPAID",
      },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false },
    },
    {
      tableName: "trip_participants",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ fields: ["trip_id"], name: "trip_participants_trip_idx" }],
    },
  );

  const TripPayment = sequelize.define(
    "TripPayment",
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      tripId: { type: DataTypes.INTEGER, field: "trip_id", allowNull: false },
      participantId: { type: DataTypes.STRING, field: "participant_id", allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      method: { type: DataTypes.STRING(64), allowNull: true },
      status: {
        type: DataTypes.ENUM("UNPAID", "PENDING", "PAID", "EXEMPTED", "REFUNDED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      receiptFileUrl: { type: DataTypes.STRING(512), field: "receipt_file_url", allowNull: true },
      note: DataTypes.TEXT,
      paidAt: { type: DataTypes.DATE, field: "paid_at", allowNull: true },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false },
    },
    {
      tableName: "trip_payments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["trip_id"], name: "trip_payments_trip_idx" },
        { fields: ["participant_id"], name: "trip_payments_participant_idx" },
      ],
    },
  );

  return {
    TripRegistrationForm,
    TripFormQuestion,
    TripFormQuestionOption,
    TripFormResponse,
    TripFormResponseAnswer,
    TripParticipant,
    TripPayment,
  };
};
