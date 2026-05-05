"use strict";

const db = require("../models");

/**
 * Busy role slugs + permission keys for a platform account (mirrors admin Prisma aggregate).
 */
async function fetchBusyAuthzForAccount(accountId) {
  const aid =
    typeof accountId === "bigint" ? accountId.toString() : accountId === undefined || accountId === null ? "" : String(accountId);
  if (!aid) return { roleSlugs: [], permissionKeys: [] };

  try {
    const rows = await db.BusyUserRoleAssignment.findAll({
      where: { accountId: aid },
      include: [
        {
          model: db.BusyRole,
          as: "role",
          attributes: ["slug"],
          include: [
            {
              model: db.BusyPermission,
              as: "permissions",
              attributes: ["key"],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    const roleSlugs = [...new Set(rows.map((r) => r.role?.slug).filter(Boolean))];
    const permissionKeys = new Set();
    for (const row of rows) {
      const perms = row.role?.permissions || [];
      for (const p of perms) {
        if (p.key) permissionKeys.add(p.key);
      }
    }
    return { roleSlugs, permissionKeys: [...permissionKeys] };
  } catch (err) {
    console.error("fetchBusyAuthzForAccount:", err);
    return { roleSlugs: [], permissionKeys: [] };
  }
}

module.exports = { fetchBusyAuthzForAccount };
