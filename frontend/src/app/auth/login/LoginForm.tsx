"use client";

import { useState } from "react";
import Link from "next/link";
import { setAuthToken } from "@/lib/api-client";
import { publicApiBase as resolveApiBase } from "@/lib/client-api-base";

const copy = {
  title: "Платформд нэвтрэх",
  subtitle: "Имэйл, нууц үг эсвэл Google ашиглан нэвтэрнэ үү.",
  email: "Имэйл",
  password: "Нууц үг",
  submit: "Нэвтрэх",
  or: "эсвэл",
  forgot: "Нууц үгээ мартсан уу?",
  noAccount: "Бүртгэлгүй юу?",
  register: "Бүртгүүлэх",
  google: "Google-р нэвтрэх",
  googlePlatform: "Google-р нэвтрэх (BUSY платформ)",
  errInvalid: "Имэйл эсвэл нууц үг буруу байна.",
  errGoogle: "Энэ бүртгэл Google-р нэвтэрдэг. Доорх товчийг ашиглана уу.",
} as const;

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button type="submit" className="bni-auth-btn-primary" disabled={pending}>
      {pending ? "…" : copy.submit}
    </button>
  );
}

type Props = {
  nextPath: string;
  legacyBase: string | null;
  /** Next.js `/api/auth/google` эсвэл legacy `google-start.php`; null бол Google товч харагдахгүй. */
  googleHref: string | null;
  defaultEmail: string;
  /** True when Google opens this app’s OAuth (`/api/auth/...`) — sets Next platform session cookies. */
  googleUsesNextPlatformOAuth?: boolean;
};

export default function LoginForm({
  nextPath,
  legacyBase,
  googleHref,
  defaultEmail,
  googleUsesNextPlatformOAuth = false,
}: Props) {
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<"invalid" | "use_google" | null>(null);
  const [emailValue, setEmailValue] = useState(defaultEmail);

  const registerHref = `/auth/register${nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`;
  const forgotHref = legacyBase ? `${legacyBase}/auth/forgot-password.php` : "#";

  const errMsg = errorKey === "use_google" ? copy.errGoogle : errorKey === "invalid" ? copy.errInvalid : null;

  const apiBase = resolveApiBase();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrorKey(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const safeNext =
      nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/platform";

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.token) {
        setErrorKey(data?.errorKey === "use_google" ? "use_google" : "invalid");
        setEmailValue(email);
        return;
      }

      setAuthToken(String(data.token));
      if (String(data.role || "") === "admin") {
        const adminBase = (process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002").replace(/\/$/, "");
        window.location.href = `${adminBase}/admin`;
        return;
      }
      window.location.href = safeNext === "/" ? "/platform" : safeNext;
    } catch {
      setErrorKey("invalid");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mb-0">
      <input type="hidden" name="next" value={nextPath} />
      {errMsg ? (
        <div className="alert alert-danger bni-auth-alert mb-4" role="alert">
          {errMsg}
        </div>
      ) : null}
      <div className="mb-3">
        <label className="form-label" htmlFor="email">
          {copy.email}
        </label>
        <div className="bni-auth-input-icon">
          <span className="bni-auth-input-ico">
            <i className="fa-solid fa-envelope" aria-hidden="true" />
          </span>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            required
            autoComplete="email"
            placeholder="name@company.com"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
          />
        </div>
      </div>
      <div className="mb-2">
        <label className="form-label" htmlFor="password">
          {copy.password}
        </label>
        <div className="bni-auth-input-icon">
          <span className="bni-auth-input-ico">
            <i className="fa-solid fa-lock" aria-hidden="true" />
          </span>
          <input
            type="password"
            className="form-control"
            id="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </div>
      </div>
      <div className="text-end mb-4">
        {legacyBase ? (
          <a href={forgotHref} className="small text-decoration-none">
            {copy.forgot}
          </a>
        ) : (
          <span className="small text-muted">{copy.forgot}</span>
        )}
      </div>
      <SubmitButton pending={pending} />
      {googleHref ? (
        <>
          <div className="bni-auth-divider">
            <span>{copy.or}</span>
          </div>
          <a href={googleHref} className="bni-auth-btn-google">
            <i className="fa-brands fa-google" aria-hidden="true" />
            {googleUsesNextPlatformOAuth ? copy.googlePlatform : copy.google}
          </a>
        </>
      ) : null}
      <div className="bni-auth-footer">
        <span>{copy.noAccount}</span> <Link href={registerHref}>{copy.register}</Link>
      </div>
    </form>
  );
}
