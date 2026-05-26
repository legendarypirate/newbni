"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("investment_projects", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: { type: Sequelize.STRING(512), allowNull: false },
      slug: { type: Sequelize.STRING(512), allowNull: true },
      sector: { type: Sequelize.STRING(255), allowNull: true },
      excerpt: { type: Sequelize.TEXT, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      cover_image_url: { type: Sequelize.STRING(512), allowNull: true },
      target_mnt: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      raised_percent: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      stage: { type: Sequelize.STRING(64), allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: "draft" },
      status_label: { type: Sequelize.STRING(255), allowNull: true },
      is_featured: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      owner_account_id: { type: Sequelize.BIGINT, allowNull: true },
      published_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    await queryInterface.addIndex("investment_projects", ["status"], {
      name: "investment_projects_status_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("investment_projects");
  },
};
