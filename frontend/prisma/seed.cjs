/**
 * Local dev only: upserts admin/user/google test accounts.
 * Run: `npm run db:seed` (requires DATABASE_URL and `npx prisma generate`).
 * Refuses to run when NODE_ENV=production.
 */
/* eslint-disable @typescript-eslint/no-require-imports */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.LOCAL_ADMIN_EMAIL || "admin@localhost.local").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.LOCAL_ADMIN_PASSWORD || "AdminLocalDev!9";
const USER_EMAIL = (process.env.LOCAL_USER_EMAIL || "user@localhost.local").trim().toLowerCase();
const USER_PASSWORD = process.env.LOCAL_USER_PASSWORD || "UserLocalDev!9";
const GOOGLE_USER_EMAIL = (process.env.LOCAL_GOOGLE_USER_EMAIL || "google.user@localhost.local").trim().toLowerCase();
const GOOGLE_USER_SUB = (process.env.LOCAL_GOOGLE_USER_SUB || "google-sub-local-001").trim();
const BCRYPT_ROUNDS = 12;

async function upsertProfile(accountId, displayName) {
  await prisma.platformProfile.upsert({
    where: { accountId },
    create: { accountId, displayName },
    update: { displayName },
  });
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("seed.cjs: refusing to run in NODE_ENV=production.");
    process.exit(1);
  }

  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
  const userPasswordHash = await bcrypt.hash(USER_PASSWORD, BCRYPT_ROUNDS);

  const admin = await prisma.platformAccount.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      role: "admin",
      status: "active",
    },
    update: {
      passwordHash: adminPasswordHash,
      role: "admin",
      status: "active",
    },
  });
  await upsertProfile(admin.id, "Local Admin");

  const user = await prisma.platformAccount.upsert({
    where: { email: USER_EMAIL },
    create: {
      email: USER_EMAIL,
      passwordHash: userPasswordHash,
      role: "member",
      status: "active",
    },
    update: {
      passwordHash: userPasswordHash,
      role: "member",
      status: "active",
    },
  });
  await upsertProfile(user.id, "Local User");

  const googleUser = await prisma.platformAccount.upsert({
    where: { email: GOOGLE_USER_EMAIL },
    create: {
      email: GOOGLE_USER_EMAIL,
      googleSub: GOOGLE_USER_SUB,
      passwordHash: null,
      role: "member",
      status: "active",
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    },
    update: {
      googleSub: GOOGLE_USER_SUB,
      passwordHash: null,
      role: "member",
      status: "active",
      emailVerifiedAt: new Date(),
    },
  });
  await upsertProfile(googleUser.id, "Google User (Local)");

  console.log("");
  console.log("Local test users upserted:");
  console.log("  Admin (http://localhost:3002/admin/login)");
  console.log("    Email:   ", ADMIN_EMAIL);
  console.log("    Password:", ADMIN_PASSWORD);
  console.log("  User (http://localhost:3000/auth/login)");
  console.log("    Email:   ", USER_EMAIL);
  console.log("    Password:", USER_PASSWORD);
  console.log("  Google user (http://localhost:3000/auth/login -> Google)");
  console.log("    Email:   ", GOOGLE_USER_EMAIL);
  console.log("    GoogleSub:", GOOGLE_USER_SUB);
  console.log("");
  console.log("Override with LOCAL_ADMIN_*, LOCAL_USER_*, LOCAL_GOOGLE_USER_* in .env");
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
