"use strict";

module.exports = function defineBusinessOpportunity(sequelize, DataTypes) {
  const BusinessOpportunity = sequelize.define(
    "BusinessOpportunity",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      authorAccountId: { type: DataTypes.BIGINT, field: "author_account_id", allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      summary: { type: DataTypes.TEXT, allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: true },
      opportunityType: {
        type: DataTypes.STRING(32),
        field: "opportunity_type",
        allowNull: false,
        defaultValue: "collaboration",
      },
      contextType: {
        type: DataTypes.STRING(32),
        field: "context_type",
        allowNull: false,
        defaultValue: "none",
      },
      contextId: { type: DataTypes.BIGINT, field: "context_id", allowNull: true },
      status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "open" },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: "bni_business_opportunities", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" },
  );

  const BusinessOpportunityApplication = sequelize.define(
    "BusinessOpportunityApplication",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      opportunityId: { type: DataTypes.BIGINT, field: "opportunity_id", allowNull: false },
      applicantAccountId: { type: DataTypes.BIGINT, field: "applicant_account_id", allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "pending" },
      responseNote: { type: DataTypes.TEXT, field: "response_note", allowNull: true },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "bni_business_opportunity_applications",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  BusinessOpportunity.hasMany(BusinessOpportunityApplication, {
    foreignKey: "opportunity_id",
    as: "applications",
  });
  BusinessOpportunityApplication.belongsTo(BusinessOpportunity, {
    foreignKey: "opportunity_id",
    as: "opportunity",
  });

  return { BusinessOpportunity, BusinessOpportunityApplication };
};
