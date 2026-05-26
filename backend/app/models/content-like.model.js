"use strict";

module.exports = function defineContentLike(sequelize, DataTypes) {
  return sequelize.define(
    "ContentLike",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      accountId: { type: DataTypes.BIGINT, field: "account_id", allowNull: false },
      targetType: { type: DataTypes.STRING(16), field: "target_type", allowNull: false },
      targetId: { type: DataTypes.STRING(64), field: "target_id", allowNull: false },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "content_likes",
      timestamps: false,
      indexes: [
        { unique: true, fields: ["account_id", "target_type", "target_id"] },
        { fields: ["target_type", "target_id"] },
      ],
    },
  );
};
