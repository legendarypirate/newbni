#!/usr/bin/env node
"use strict";

/**
 * Copy all rows from `news` (local → prod or any two Postgres DBs).
 *
 * Run from the backend folder on Ubuntu:
 *
 *   cd /path/to/newbni/backend
 *   npm install   # if node_modules missing
 *
 * One-shot sync (reads local, writes prod):
 *
 *   SOURCE_DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/shine" \
 *   TARGET_DATABASE_URL="postgresql://user:pass@prod-host:5432/shine?sslmode=require" \
 *   node scripts/copy-news-table.js
 *
 * Dry run (no writes):
 *
 *   SOURCE_DATABASE_URL="..." TARGET_DATABASE_URL="..." \
 *   node scripts/copy-news-table.js --dry-run
 *
 * Export to JSON only (backup / inspect):
 *
 *   SOURCE_DATABASE_URL="postgresql://..." \
 *   node scripts/copy-news-table.js export --out ./news-export.json
 *
 * Import from JSON:
 *
 *   TARGET_DATABASE_URL="postgresql://..." \
 *   node scripts/copy-news-table.js import --in ./news-export.json
 *
 * Replace all rows on target first (destructive on prod news table only):
 *
 *   ... node scripts/copy-news-table.js --truncate-target
 *
 * On slug conflict when id differs: --on-conflict=skip | update | fail (default: update by id)
 *
 * Notes:
 * - `author_id` must exist on the target DB (platform accounts), or inserts fail.
 * - After import, the script resets `news_id_seq` to max(id).
 * - Alternative without Node: pg_dump -t news ... | psql ... (see comments at bottom of file).
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const NEWS_COLUMNS = [
  "id",
  "category",
  "type",
  "create_date",
  "title",
  "slug",
  "excerpt",
  "content",
  "body",
  "image",
  "images",
  "author_id",
  "status",
  "featured",
  "created_at",
  "updated_at",
];

function usage(exitCode = 1) {
  console.error(`
Usage:
  node scripts/copy-news-table.js [export|import] [options]

Modes:
  (default)     Copy SOURCE_DATABASE_URL → TARGET_DATABASE_URL
  export        Write all news rows to JSON (--out required)
  import        Load JSON into TARGET_DATABASE_URL (--in required)

Env:
  SOURCE_DATABASE_URL   Local / source Postgres URL
  TARGET_DATABASE_URL   Production / target Postgres URL
  (fallback: DATABASE_URL for whichever side is missing in export/import)

Options:
  --out <file>            JSON path for export
  --in <file>             JSON path for import
  --dry-run               Print counts only, no target writes
  --truncate-target       TRUNCATE news on target before insert
  --on-conflict=update    Upsert by id (default)
  --on-conflict=skip      Skip rows whose id already exists
  --on-conflict=fail      Stop on first duplicate id
  --no-reset-sequence     Do not run setval on news_id_seq after import
`);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { mode: "sync", flags: new Set(), opts: {} };
  const rest = [...argv];
  if (rest[0] === "export" || rest[0] === "import") {
    args.mode = rest.shift();
  }
  while (rest.length) {
    const a = rest.shift();
    if (a === "--dry-run") args.flags.add("dry-run");
    else if (a === "--truncate-target") args.flags.add("truncate-target");
    else if (a === "--no-reset-sequence") args.flags.add("no-reset-sequence");
    else if (a.startsWith("--on-conflict=")) args.opts.onConflict = a.split("=")[1];
    else if (a === "--out") args.opts.out = rest.shift();
    else if (a === "--in") args.opts.in = rest.shift();
    else if (a === "-h" || a === "--help") usage(0);
    else {
      console.error("Unknown argument:", a);
      usage();
    }
  }
  if (!args.opts.onConflict) args.opts.onConflict = "update";
  if (!["update", "skip", "fail"].includes(args.opts.onConflict)) {
    console.error("Invalid --on-conflict value:", args.opts.onConflict);
    usage();
  }
  return args;
}

function sslFromUrl(url) {
  if (!url) return undefined;
  const u = url.toLowerCase();
  if (u.includes("sslmode=require") || u.includes("ssl=true")) {
    return { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" };
  }
  return undefined;
}

function makeClient(connectionString) {
  if (!connectionString) {
    throw new Error("Missing database URL (set SOURCE_DATABASE_URL or TARGET_DATABASE_URL)");
  }
  const ssl = sslFromUrl(connectionString);
  return new Client({ connectionString, ssl: ssl || undefined });
}

async function fetchAllNews(client) {
  const colList = NEWS_COLUMNS.map((c) => `"${c}"`).join(", ");
  const { rows } = await client.query(`SELECT ${colList} FROM news ORDER BY id ASC`);
  return rows;
}

function buildUpsertQuery(onConflict) {
  const cols = NEWS_COLUMNS.map((c) => `"${c}"`).join(", ");
  const placeholders = NEWS_COLUMNS.map((_, i) => `$${i + 1}`).join(", ");
  const updates = NEWS_COLUMNS.filter((c) => c !== "id")
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(", ");

  if (onConflict === "skip") {
    return {
      text: `
        INSERT INTO news (${cols})
        VALUES (${placeholders})
        ON CONFLICT (id) DO NOTHING
      `,
    };
  }
  if (onConflict === "fail") {
    return {
      text: `
        INSERT INTO news (${cols})
        VALUES (${placeholders})
      `,
    };
  }
  return {
    text: `
      INSERT INTO news (${cols})
      VALUES (${placeholders})
      ON CONFLICT (id) DO UPDATE SET ${updates}
    `,
  };
}

function rowToValues(row) {
  return NEWS_COLUMNS.map((c) => row[c]);
}

async function importRows(client, rows, options) {
  const { dryRun, truncateTarget, onConflict, resetSequence } = options;
  const upsert = buildUpsertQuery(onConflict);

  if (dryRun) {
    console.log(`[dry-run] Would import ${rows.length} row(s) (on-conflict=${onConflict})`);
    if (truncateTarget) console.log("[dry-run] Would TRUNCATE news on target first");
    return { inserted: 0, skipped: 0, updated: rows.length };
  }

  await client.query("BEGIN");
  try {
    if (truncateTarget) {
      await client.query("TRUNCATE TABLE news RESTART IDENTITY");
      console.log("Truncated table news on target.");
    }

    let written = 0;
    let skipped = 0;
    for (const row of rows) {
      const values = rowToValues(row);
      if (onConflict === "skip") {
        const res = await client.query(upsert.text, values);
        if (res.rowCount === 0) skipped += 1;
        else written += 1;
      } else {
        await client.query(upsert.text, values);
        written += 1;
      }
    }

    if (resetSequence && rows.length > 0) {
      const maxId = Math.max(...rows.map((r) => Number(r.id)));
      await client.query(
        `SELECT setval(pg_get_serial_sequence('news', 'id'), $1, true)`,
        [maxId],
      );
      console.log(`Reset news id sequence to ${maxId}.`);
    }

    await client.query("COMMIT");
    return { inserted: written, skipped, updated: written };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

async function cmdExport(sourceUrl, outPath) {
  const client = makeClient(sourceUrl);
  await client.connect();
  try {
    const rows = await fetchAllNews(client);
    const abs = path.resolve(outPath);
    fs.writeFileSync(abs, JSON.stringify({ exportedAt: new Date().toISOString(), count: rows.length, rows }, null, 2));
    console.log(`Exported ${rows.length} row(s) to ${abs}`);
  } finally {
    await client.end();
  }
}

async function cmdImport(targetUrl, inPath, options) {
  const abs = path.resolve(inPath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  const payload = JSON.parse(fs.readFileSync(abs, "utf8"));
  const rows = Array.isArray(payload) ? payload : payload.rows;
  if (!Array.isArray(rows)) throw new Error("JSON must be { rows: [...] } or an array");

  const client = makeClient(targetUrl);
  await client.connect();
  try {
    const stats = await importRows(client, rows, options);
    console.log(`Import finished. processed=${rows.length} written=${stats.inserted} skipped=${stats.skipped}`);
  } finally {
    await client.end();
  }
}

async function cmdSync(sourceUrl, targetUrl, options) {
  const source = makeClient(sourceUrl);
  const target = makeClient(targetUrl);
  await source.connect();
  await target.connect();
  try {
    const rows = await fetchAllNews(source);
    console.log(`Read ${rows.length} row(s) from source.`);
    const stats = await importRows(target, rows, options);
    console.log(`Sync finished. written=${stats.inserted} skipped=${stats.skipped}`);
  } finally {
    await source.end();
    await target.end();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const options = {
    dryRun: args.flags.has("dry-run"),
    truncateTarget: args.flags.has("truncate-target"),
    resetSequence: !args.flags.has("no-reset-sequence"),
    onConflict: args.opts.onConflict,
  };

  const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.LOCAL_DATABASE_URL;
  const targetUrl = process.env.TARGET_DATABASE_URL || process.env.PROD_DATABASE_URL;

  if (args.mode === "export") {
    if (!args.opts.out) {
      console.error("--out <file> is required for export");
      usage();
    }
    const url = sourceUrl || process.env.DATABASE_URL;
    await cmdExport(url, args.opts.out);
    return;
  }

  if (args.mode === "import") {
    if (!args.opts.in) {
      console.error("--in <file> is required for import");
      usage();
    }
    const url = targetUrl || process.env.DATABASE_URL;
    await cmdImport(url, args.opts.in, options);
    return;
  }

  if (!sourceUrl || !targetUrl) {
    console.error("Sync requires SOURCE_DATABASE_URL and TARGET_DATABASE_URL");
    usage();
  }

  await cmdSync(sourceUrl, targetUrl, options);
}

main().catch((err) => {
  console.error("copy-news-table failed:", err.message || err);
  if (err.code) console.error("code:", err.code);
  if (err.detail) console.error("detail:", err.detail);
  process.exit(1);
});
