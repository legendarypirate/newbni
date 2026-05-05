"use strict";

/** Maps `business_trips` — marketing / organizer trips. */
module.exports = function defineBusinessTrip(sequelize, DataTypes) {
  return sequelize.define(
    "BusinessTrip",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      destination: { type: DataTypes.STRING(512), allowNull: false },
      startDate: { type: DataTypes.DATEONLY, field: "start_date", allowNull: false },
      endDate: { type: DataTypes.DATEONLY, field: "end_date", allowNull: false },
      focus: DataTypes.TEXT,
      description: DataTypes.TEXT,
      statusLabel: { type: DataTypes.STRING(255), field: "status_label", allowNull: true },
      seatsLabel: { type: DataTypes.STRING(255), field: "seats_label", allowNull: true },
      managerAccountId: { type: DataTypes.BIGINT, field: "manager_account_id", allowNull: true },
      coverImageUrl: { type: DataTypes.STRING(512), field: "cover_image_url", allowNull: true },
      heroSliderJson: { type: DataTypes.TEXT, field: "hero_slider_json", allowNull: true },
      priceMnt: { type: DataTypes.DECIMAL(12, 2), field: "price_mnt", allowNull: true },
      advanceOrderMnt: { type: DataTypes.DECIMAL(12, 2), field: "advance_order_mnt", allowNull: true },
      isFeatured: { type: DataTypes.INTEGER, field: "is_featured", allowNull: false, defaultValue: 0 },
      registrationFormJson: { type: DataTypes.JSONB, field: "registration_form_json", allowNull: true },
      itineraryJson: { type: DataTypes.JSONB, field: "itinerary_json", allowNull: true },
      extrasJson: { type: DataTypes.JSONB, field: "extras_json", allowNull: true },
    },
    { tableName: "business_trips", timestamps: false },
  );
};
