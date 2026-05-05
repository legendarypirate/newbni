"use strict";

/** Maps `bni_events` — platform calendar events (weekly meetings, etc.). */
module.exports = function defineBniEvent(sequelize, DataTypes) {
  return sequelize.define(
    "BniEvent",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      chapterId: { type: DataTypes.INTEGER, field: "chapter_id", allowNull: true },
      scheduleId: { type: DataTypes.INTEGER, field: "schedule_id", allowNull: true },
      eventType: { type: DataTypes.STRING(64), field: "event_type", allowNull: false, defaultValue: "weekly_meeting" },
      startsAt: { type: DataTypes.DATE, field: "starts_at", allowNull: false },
      endsAt: { type: DataTypes.DATE, field: "ends_at", allowNull: false },
      location: { type: DataTypes.STRING(512), allowNull: true },
      isOnline: { type: DataTypes.BOOLEAN, field: "is_online", allowNull: false, defaultValue: false },
      curriculumId: { type: DataTypes.INTEGER, field: "curriculum_id", allowNull: true },
      curriculumOverrideJson: { type: DataTypes.JSONB, field: "curriculum_override_json", allowNull: true },
      registrationFormJson: { type: DataTypes.JSONB, field: "registration_form_json", allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: true },
      priceMnt: { type: DataTypes.DECIMAL(12, 2), field: "price_mnt", allowNull: true },
      advanceOrderMnt: { type: DataTypes.DECIMAL(12, 2), field: "advance_order_mnt", allowNull: true },
    },
    {
      tableName: "bni_events",
      timestamps: true,
      updatedAt: false,
      createdAt: "created_at",
      indexes: [{ fields: ["chapter_id", "starts_at"], name: "bni_events_chapter_starts_idx" }],
    },
  );
};
