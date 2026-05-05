"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("site_settings", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      setting_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      setting_value: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.sequelize.query(
      `INSERT INTO site_settings (setting_name, setting_value, created_at, updated_at)
       VALUES ('footer_public_json', '{}', NOW(), NOW())
       ON CONFLICT (setting_name) DO NOTHING;`,
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("site_settings");
  },
};
