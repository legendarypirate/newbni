"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("content_likes", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      account_id: { type: Sequelize.BIGINT, allowNull: false },
      target_type: { type: Sequelize.STRING(16), allowNull: false },
      target_id: { type: Sequelize.STRING(64), allowNull: false },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
    await queryInterface.addIndex("content_likes", ["target_type", "target_id"], {
      name: "content_likes_target_idx",
    });
    await queryInterface.addIndex("content_likes", ["account_id"], {
      name: "content_likes_account_idx",
    });
    await queryInterface.addConstraint("content_likes", {
      fields: ["account_id", "target_type", "target_id"],
      type: "unique",
      name: "content_likes_uniq",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("content_likes");
  },
};
