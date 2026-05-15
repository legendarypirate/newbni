"use strict";

module.exports = function defineContentTranslation(sequelize, DataTypes) {
  return sequelize.define(
    "ContentTranslation",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      entityType: { type: DataTypes.STRING(64), field: "entity_type", allowNull: false },
      entityId: { type: DataTypes.STRING(64), field: "entity_id", allowNull: false },
      fieldName: { type: DataTypes.STRING(64), field: "field_name", allowNull: false },
      lang: { type: DataTypes.STRING(8), allowNull: false },
      value: { type: DataTypes.TEXT, allowNull: false },
      sourceHash: { type: DataTypes.STRING(64), field: "source_hash", allowNull: true },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false },
    },
    {
      tableName: "bni_content_translations",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
};
