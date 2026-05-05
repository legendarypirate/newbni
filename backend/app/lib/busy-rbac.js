"use strict";

const db = require("../models");

const BUSY_ROLE_SLUGS = {
  guest: "guest",
  registeredUser: "registered_user",
  businessMember: "business_member",
  organizer: "organizer",
  supplier: "supplier",
  investor: "investor",
  admin: "admin",
  superAdmin: "super_admin",
};

const BUSY_PERMISSIONS = {
  weeklyMeetingManageOwn: "weekly_meeting.manage_own",
  weeklyMeetingManageAny: "weekly_meeting.manage_any",
  adminUsersRead: "admin.users.read",
};

/**
 * Bootstrap Busy RBAC rows (idempotent). Mirrors admin `ensureBusyRbacSeed`.
 */
async function ensureBusyRbacSeed() {
  try {
    const roleCount = await db.BusyRole.count();
    if (roleCount > 0) return;
  } catch {
    return;
  }

  const roles = [
    { slug: BUSY_ROLE_SLUGS.guest, label: "Guest" },
    { slug: BUSY_ROLE_SLUGS.registeredUser, label: "Registered user" },
    { slug: BUSY_ROLE_SLUGS.businessMember, label: "Business member" },
    { slug: BUSY_ROLE_SLUGS.organizer, label: "Organizer" },
    { slug: BUSY_ROLE_SLUGS.supplier, label: "Supplier" },
    { slug: BUSY_ROLE_SLUGS.investor, label: "Investor" },
    { slug: BUSY_ROLE_SLUGS.admin, label: "Admin" },
    { slug: BUSY_ROLE_SLUGS.superAdmin, label: "Super admin" },
  ];

  const perms = [
    { key: BUSY_PERMISSIONS.weeklyMeetingManageOwn, description: "Create and manage own weekly meetings" },
    { key: BUSY_PERMISSIONS.weeklyMeetingManageAny, description: "Manage any weekly meeting" },
    { key: BUSY_PERMISSIONS.adminUsersRead, description: "Read users (admin panel)" },
  ];

  try {
    await db.sequelize.transaction(async (t) => {
      await db.BusyRole.bulkCreate(roles, { transaction: t, ignoreDuplicates: true });
      await db.BusyPermission.bulkCreate(perms, { transaction: t, ignoreDuplicates: true });

      const dbRoles = await db.BusyRole.findAll({ transaction: t });
      const dbPerms = await db.BusyPermission.findAll({ transaction: t });
      const bySlug = new Map(dbRoles.map((r) => [r.slug, r.id]));
      const byKey = new Map(dbPerms.map((p) => [p.key, p.id]));

      const links = [];
      const organizerId = bySlug.get(BUSY_ROLE_SLUGS.organizer);
      const adminId = bySlug.get(BUSY_ROLE_SLUGS.admin);
      const superId = bySlug.get(BUSY_ROLE_SLUGS.superAdmin);
      const pOwn = byKey.get(BUSY_PERMISSIONS.weeklyMeetingManageOwn);
      const pAny = byKey.get(BUSY_PERMISSIONS.weeklyMeetingManageAny);
      const pUsers = byKey.get(BUSY_PERMISSIONS.adminUsersRead);

      if (organizerId && pOwn) links.push({ roleId: organizerId, permissionId: pOwn });
      if (adminId && pAny) links.push({ roleId: adminId, permissionId: pAny });
      if (adminId && pUsers) links.push({ roleId: adminId, permissionId: pUsers });
      if (superId && pAny) links.push({ roleId: superId, permissionId: pAny });
      if (superId && pUsers) links.push({ roleId: superId, permissionId: pUsers });

      if (links.length) {
        await db.BusyRolePermission.bulkCreate(links, { transaction: t, ignoreDuplicates: true });
      }
    });
  } catch {
    /* concurrent first boot */
  }
}

/**
 * Idempotent: gives active non-visitor accounts the `organizer` Busy role so `weekly_meeting.manage_own` applies.
 * Call after successful login (email + Google).
 */
async function ensureOrganizerRoleForEligibleAccount(accountId) {
  let acc;
  try {
    acc = await db.PlatformAccount.findByPk(accountId, { attributes: ["role"] });
  } catch (err) {
    console.error("RBAC: find account failed", err);
    return;
  }
  if (!acc || acc.role === "visitor") return;

  await ensureBusyRbacSeed();

  let organizerId;
  try {
    const organizer = await db.BusyRole.findOne({
      where: { slug: BUSY_ROLE_SLUGS.organizer },
      attributes: ["id"],
    });
    organizerId = organizer?.id;
  } catch (err) {
    console.error("RBAC: find role failed", err);
    return;
  }
  if (organizerId === undefined) return;

  try {
    await db.BusyUserRoleAssignment.findOrCreate({
      where: { accountId, roleId: organizerId },
      defaults: { accountId, roleId: organizerId },
    });
  } catch (err) {
    // console.error("RBAC: upsert failed", err);
  }
}

module.exports = {
  ensureBusyRbacSeed,
  ensureOrganizerRoleForEligibleAccount,
};
