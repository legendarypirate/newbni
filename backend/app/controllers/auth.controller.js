"use strict";

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../models");
const { upsertPlatformAccountFromGoogle } = require("../lib/platform-google-upsert");
const { ensureOrganizerRoleForEligibleAccount } = require("../lib/busy-rbac");
const { fetchBusyAuthzForAccount } = require("../lib/busy-authz");

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only";

const STATE_COOKIE = "bni_google_oauth_state";
const NEXT_COOKIE = "bni_google_oauth_next";

function frontendOrigin() {
  return process.env.FRONTEND_ORIGIN || "http://localhost:3000";
}

function adminOrigin() {
  return process.env.ADMIN_ORIGIN || "http://localhost:3002";
}

function tokenCookieOptions(req) {
  const isSecure = req.protocol === "https";
  return {
    httpOnly: false,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

function safeNextPath(raw) {
  if (!raw || typeof raw !== "string") return "/";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/";
  return t.slice(0, 512);
}

function signPlatformToken(account) {
  return jwt.sign(
    {
      id: String(account.id),
      email: account.email,
      role: account.role,
      displayName: account.profile?.displayName || account.email,
    },
    JWT_SECRET,
    { expiresIn: "30d" },
  );
}

exports.passwordLogin = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ ok: false, errorKey: "invalid" });
  }

  try {
    const account = await db.PlatformAccount.findOne({
      where: { email },
      include: [{ model: db.PlatformProfile, as: "profile", attributes: ["displayName"] }],
    });
    if (!account || account.status !== "active") {
      return res.status(401).json({ ok: false, errorKey: "invalid" });
    }

    const hash = account.passwordHash;
    if (!hash || hash === "") {
      return res.status(401).json({ ok: false, errorKey: "use_google" });
    }

    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return res.status(401).json({ ok: false, errorKey: "invalid" });
    }

    await account.update({ lastLoginAt: new Date() });
    await ensureOrganizerRoleForEligibleAccount(account.id);

    const token = signPlatformToken(account);
    return res.json({ ok: true, token, role: account.role });
  } catch (err) {
    console.error("Password login failed:", err);
    return res.status(500).json({ ok: false, errorKey: "invalid" });
  }
};

exports.adminPasswordLogin = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ ok: false, errorKey: "invalid" });
  }

  try {
    const account = await db.PlatformAccount.findOne({
      where: { email },
      include: [{ model: db.PlatformProfile, as: "profile", attributes: ["displayName"] }],
    });
    if (!account || account.status !== "active") {
      return res.status(401).json({ ok: false, errorKey: "invalid" });
    }
    if (account.role !== "admin") {
      return res.status(403).json({ ok: false, errorKey: "forbidden" });
    }

    const hash = account.passwordHash;
    if (!hash || hash === "") {
      return res.status(401).json({ ok: false, errorKey: "use_google" });
    }

    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return res.status(401).json({ ok: false, errorKey: "invalid" });
    }

    await account.update({ lastLoginAt: new Date() });
    await ensureOrganizerRoleForEligibleAccount(account.id);

    const token = signPlatformToken(account);
    return res.json({ ok: true, token, role: account.role });
  } catch (err) {
    console.error("Admin password login failed:", err);
    return res.status(500).json({ ok: false, errorKey: "invalid" });
  }
};

exports.googleStart = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    console.error("Google OAuth config missing:", {
      hasClientId: Boolean(clientId),
      hasClientSecret: Boolean(clientSecret),
    });
    return res.redirect(`${frontendOrigin()}/auth/login?error=google_config`);
  }

  const origin = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const state = crypto.randomBytes(16).toString("hex");
  const next = safeNextPath(req.query.next);

  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  }).toString()}`;

  res.cookie(STATE_COOKIE, state, { httpOnly: true, maxAge: 600000 });
  res.cookie(NEXT_COOKIE, next, { httpOnly: true, maxAge: 600000 });

  res.redirect(googleUrl);
};

exports.googleCallback = async (req, res) => {
  const savedState = req.cookies[STATE_COOKIE];
  const { state, code, error } = req.query;

  if (!savedState || !state || savedState !== state) {
    return res.redirect(`${frontendOrigin()}/auth/login?error=google_state`);
  }

  if (error) {
    return res.redirect(`${frontendOrigin()}/auth/login?error=google_denied&detail=${error}`);
  }

  if (!code) {
    return res.redirect(`${frontendOrigin()}/auth/login?error=google_code`);
  }

  const origin = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const nextPath = safeNextPath(req.cookies[NEXT_COOKIE]);

  try {
    // 1. Exchange code for token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error || "token_failed");

    // 2. Fetch user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userRes.json();
    if (!userRes.ok) throw new Error("profile_failed");

    // 3. Upsert account
    const account = await upsertPlatformAccountFromGoogle({
      googleSub: String(profile.id),
      email: profile.email,
      name: profile.name || "",
      picture: profile.picture || "",
    });

    if (!account) throw new Error("google_db");

    await ensureOrganizerRoleForEligibleAccount(account.id);

    // 4. Generate JWT
    const token = jwt.sign(
      {
        id: String(account.id),
        email: account.email,
        role: account.role,
        displayName: account.profile?.displayName || account.email,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // 5. Redirect back to frontend with token
    res.clearCookie(STATE_COOKIE);
    res.clearCookie(NEXT_COOKIE);
    
    const isAdmin = account.role === "admin";
    const nextTarget = isAdmin ? "/admin" : nextPath === "/" ? "/platform" : nextPath;
    const dest = new URL(isAdmin ? adminOrigin() : frontendOrigin());
    // Redirect to login first so client TokenHandler can persist token before hitting protected routes.
    dest.pathname = isAdmin ? "/admin/login" : "/auth/login";
    dest.searchParams.set("next", nextTarget);
    dest.searchParams.set("token", token);
    // Best-effort cookie for same-origin deployments.
    res.cookie("bni_token", token, tokenCookieOptions(req));

    res.redirect(dest.toString());
  } catch (err) {
    console.error("OAuth Callback Error:", err);
    res.redirect(`${frontendOrigin()}/auth/login?error=google_db`);
  }
};

exports.me = async (req, res) => {
  try {
    const jwtUser = req.user;
    const id = jwtUser.id;
    const account = await db.PlatformAccount.findByPk(id, {
      attributes: ["id", "email", "role"],
      include: [{ model: db.PlatformProfile, as: "profile", attributes: ["displayName", "photoUrl"] }],
    });
    const authz = await fetchBusyAuthzForAccount(id);
    const displayName =
      jwtUser.displayName || account?.profile?.displayName || account?.email || jwtUser.email || "";

    res.json({
      ok: true,
      user: {
        id: String(account?.id ?? id),
        email: account?.email ?? jwtUser.email,
        displayName,
        role: account?.role ?? jwtUser.role,
        photoUrl: account?.profile?.photoUrl ?? null,
        busyRoleSlugs: authz.roleSlugs,
        busyPermissionKeys: authz.permissionKeys,
      },
    });
  } catch (err) {
    console.error("auth.me enrich failed:", err);
    res.json({ ok: true, user: req.user });
  }
};
