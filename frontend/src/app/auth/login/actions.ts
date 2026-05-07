"use server";

import { redirect } from "next/navigation";
import { defaultPostLoginPath } from "@/lib/platform-session";
import { setPlatformSessionCookies } from "@/lib/platform-session-cookies";
import { internalApiUrl } from "@/lib/backend-api";

export type LoginFormState = {
  errorKey: "invalid" | "use_google" | null;
  email: string;
};

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function safeNextPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "/";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/";
  return t.slice(0, 512);
}

export async function loginAction(_prev: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const emailRaw = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));
  const email = normalizeEmail(emailRaw);

  if (!email || !password) {
    return { errorKey: "invalid", email: emailRaw };
  }

  try {
    const res = await fetch(internalApiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();

    if (!res.ok) {
      return { errorKey: json.errorKey || "invalid", email: emailRaw };
    }

    await setPlatformSessionCookies(json.token, json.displayName);
    redirect(defaultPostLoginPath(next, json.role));
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") throw e;
    return { errorKey: "invalid", email: emailRaw };
  }
}
