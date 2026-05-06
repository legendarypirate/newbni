"use server";

import { redirect } from "next/navigation";
import { defaultPostLoginPath } from "@/lib/platform-session";
import { setPlatformSessionCookies } from "@/lib/platform-session-cookies";

export type RegisterFormState = {
  errorKey:
    | "invalid"
    | "password_mismatch"
    | "password_weak"
    | "terms_required"
    | "email_taken"
    | "use_google"
    | "account_inactive"
    | "server_error"
    | null;
  displayName: string;
  email: string;
};

const BCRYPT_ROUNDS = 12;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function safeNextPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "/";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/";
  return t.slice(0, 512);
}

function isWeakPassword(p: string): boolean {
  return p.length < 8;
}

export async function registerAction(_prev: RegisterFormState, formData: FormData): Promise<RegisterFormState> {
  const displayNameRaw = String(formData.get("displayName") ?? "");
  const emailRaw = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const terms = String(formData.get("terms") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  const displayName = displayNameRaw.trim();
  const email = normalizeEmail(emailRaw);

  const baseState: RegisterFormState = {
    errorKey: null,
    displayName: displayNameRaw,
    email: emailRaw,
  };

  if (!displayName || !email || !password) {
    return { ...baseState, errorKey: "invalid" };
  }

  if (!terms || terms !== "on") {
    return { ...baseState, errorKey: "terms_required" };
  }

  if (password !== passwordConfirm) {
    return { ...baseState, errorKey: "password_mismatch" };
  }

  if (isWeakPassword(password)) {
    return { ...baseState, errorKey: "password_weak" };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });
    const json = await res.json();

    if (!res.ok) {
      return { ...baseState, errorKey: json.errorKey || "server_error" };
    }

    await setPlatformSessionCookies(json.token, json.displayName);
    redirect(defaultPostLoginPath(next, json.role));
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") throw e;
    return { ...baseState, errorKey: "server_error" };
  }
}
