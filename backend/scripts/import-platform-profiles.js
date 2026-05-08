"use strict";

/**
 * Import the `bni_platform_profiles` rows (and minimal `bni_platform_accounts`
 * stubs) so the news detail page can resolve `news.author_id` → display name +
 * photo_url.
 *
 * Usage (from the `backend` folder):
 *
 *     npm run db:import-profiles
 *     npm run db:import-profiles -- --reset    # destructive: drops profiles
 *
 * The script just executes the canonical SQL file in `sql/` so the SQL stays
 * the single source of truth (also paste-able into pgAdmin).
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");

const { createSequelize } = require("../app/config/db.config");

const RESET = process.argv.includes("--reset");
const sequelize = createSequelize();

async function main() {
    const cfg = sequelize.config || {};
    console.log(
        `→ Connecting to postgres://${cfg.username || "?"}@${cfg.host || "?"}:${cfg.port || "?"}/${cfg.database || "?"}`,
    );

    await sequelize.authenticate();
    console.log("✓ Connected.");

    if (RESET) {
        console.log("⚠ --reset passed: dropping `bni_platform_profiles` table");
        await sequelize.query("DROP TABLE IF EXISTS bni_platform_profiles CASCADE;");
    }

    const sqlPath = path.join(__dirname, "..", "sql", "bni-platform-profiles.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    console.log(`→ Executing ${path.relative(process.cwd(), sqlPath)}`);
    await sequelize.query(sql);
    console.log("✓ Schema + data applied.");

    const [rows] = await sequelize.query(
        `SELECT account_id, display_name, company_name,
                (photo_url IS NOT NULL) AS has_photo
         FROM bni_platform_profiles
         ORDER BY account_id;`,
    );
    console.log("\nCurrent rows in `bni_platform_profiles`:");
    for (const r of rows) {
        console.log(
            `  #${r.account_id}  ${r.has_photo ? "📷" : "  "}  ${r.display_name}  (${r.company_name || "—"})`,
        );
    }
}

main()
    .then(() => sequelize.close())
    .then(() => process.exit(0))
    .catch(async (err) => {
        console.error("\n✗ Import failed:", err.message);
        if (err.original) console.error("  pg detail:", err.original.message);
        try { await sequelize.close(); } catch {}
        process.exit(1);
    });
