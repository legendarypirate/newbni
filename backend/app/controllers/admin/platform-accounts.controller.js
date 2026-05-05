"use strict";

const bcrypt = require("bcryptjs");
const db = require("../../models");
const { ensureOrganizerRoleForEligibleAccount, ensureBusyRbacSeed } = require("../../lib/busy-rbac");

const BCRYPT_ROUNDS = 12;

const ROLES = new Set(["visitor", "member", "director", "admin", "super_admin", "trip_manager", "event_manager"]);
const CREATABLE_ROLES = new Set(["trip_manager", "event_manager", "visitor", "member", "director", "admin"]);

function normalizeEmail(raw) {
  return String(raw || "").trim().toLowerCase();
}

function toDbRole(role) {
  if (role === "super_admin" || role === "trip_manager" || role === "event_manager") {
    return "admin";
  }
  return role;
}

exports.listPlatformAccounts = async (_req, res) => {
  try {
    const rows = await db.PlatformAccount.findAll({
      order: [["id", "DESC"]],
      limit: 300,
      attributes: ["id", "email", "role"],
      include: [{ model: db.PlatformProfile, as: "profile", attributes: ["displayName", "companyName"] }],
    });
    res.json({
      ok: true,
      rows: rows.map((r) => ({
        id: String(r.id),
        email: r.email,
        role: r.role,
        profile: r.profile
          ? { displayName: r.profile.displayName ?? null, companyName: r.profile.companyName ?? null }
          : null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) });
  }
};

exports.createPlatformStaffUser = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const displayNameRaw = String(req.body?.display_name || "").trim();
  const roleRaw = String(req.body?.role || "").trim();

  if (!email || !password || !CREATABLE_ROLES.has(roleRaw)) {
    return res.status(400).json({ ok: false, errorKey: "invalid" });
  }
  if (password.length < 8) {
    return res.status(400).json({ ok: false, errorKey: "weak_password" });
  }

  try {
    const existing = await db.PlatformAccount.findOne({ where: { email }, attributes: ["id"] });
    if (existing) {
      return res.status(409).json({ ok: false, errorKey: "email_taken" });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const displayName = displayNameRaw || email.split("@")[0] || email;
    const dbRole = toDbRole(roleRaw);

    const account = await db.sequelize.transaction(async (t) => {
      const acc = await db.PlatformAccount.create(
        {
          email,
          passwordHash,
          role: dbRole,
          status: "active",
        },
        { transaction: t },
      );
      await db.PlatformProfile.create(
        {
          accountId: acc.id,
          displayName,
        },
        { transaction: t },
      );
      return acc;
    });

    try {
      await ensureOrganizerRoleForEligibleAccount(account.id);
    } catch {
      /* non-fatal */
    }

    res.json({ ok: true, id: String(account.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) });
  }
};

exports.patchPlatformAccountRole = async (req, res) => {
  const idStr = String(req.params.id || "").trim();
  const roleRaw = String(req.body?.role || "").trim();

  if (!idStr || !ROLES.has(roleRaw)) {
    return res.status(400).json({ ok: false, errorKey: "invalid" });
  }

  try {
    const dbRole = toDbRole(roleRaw);
    const [n] = await db.PlatformAccount.update({ role: dbRole }, { where: { id: idStr } });
    if (!n) {
      return res.status(404).json({ ok: false, errorKey: "not_found" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : String(err) });
  }
};

exports.ensureBusyRbacSeedHttp = async (_req, res) => {
  try {
    await ensureBusyRbacSeed();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
};

exports.ensureOrganizerForPlatformAccount = async (req, res) => {
  const idStr = String(req.params.id || "").trim();
  if (!idStr) return res.status(400).json({ ok: false });
  try {
    await ensureOrganizerRoleForEligibleAccount(idStr);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
};
