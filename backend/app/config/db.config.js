"use strict";

require("dotenv").config();

const useSsl = process.env.DATABASE_SSL === "true";

const dialectOptions = useSsl
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
      },
    }
  : {};

/**
 * Sequelize instance — same env strategy as root `DATABASE_URL` (Prisma-compatible).
 * @returns {import('sequelize').Sequelize}
 */
function createSequelize() {
  const { Sequelize } = require("sequelize");
  const url = process.env.DATABASE_URL;

  const baseOpts = {
    dialect: "postgres",
    logging: process.env.DB_LOGGING === "true" ? console.log : false,
    dialectOptions,
    define: {
      freezeTableName: true,
      underscored: false,
    },
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: Number(process.env.DB_POOL_MIN || 0),
    },
  };

  if (url) {
    return new Sequelize(url, baseOpts);
  }

  return new Sequelize(
    process.env.DB_NAME || "shine",
    process.env.DB_USER || "postgres",
    process.env.DB_PASSWORD || "Joker0328",
    {
      ...baseOpts,
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 5432),
    },
  );
}

module.exports = {
  createSequelize,
};
