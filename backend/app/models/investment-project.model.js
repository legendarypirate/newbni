"use strict";

/** Maps `investment_projects` — public fundraising listings on /investments. */
module.exports = function defineInvestmentProject(sequelize, DataTypes) {
  return sequelize.define(
    "InvestmentProject",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING(512), allowNull: false },
      slug: { type: DataTypes.STRING(512), allowNull: true },
      sector: { type: DataTypes.STRING(255), allowNull: true },
      excerpt: DataTypes.TEXT,
      description: DataTypes.TEXT,
      coverImageUrl: { type: DataTypes.STRING(512), field: "cover_image_url", allowNull: true },
      targetMnt: { type: DataTypes.DECIMAL(14, 2), field: "target_mnt", allowNull: true },
      raisedPercent: { type: DataTypes.INTEGER, field: "raised_percent", allowNull: false, defaultValue: 0 },
      stage: { type: DataTypes.STRING(64), allowNull: true },
      location: { type: DataTypes.STRING(255), allowNull: true },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "draft" },
      statusLabel: { type: DataTypes.STRING(255), field: "status_label", allowNull: true },
      isFeatured: { type: DataTypes.INTEGER, field: "is_featured", allowNull: false, defaultValue: 0 },
      ownerAccountId: { type: DataTypes.BIGINT, field: "owner_account_id", allowNull: true },
      publishedAt: { type: DataTypes.DATE, field: "published_at", allowNull: true },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "investment_projects",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
};
