"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { setAuthToken } from "@/lib/api-client";
import { publicApiBase as resolveApiBase } from "@/lib/client-api-base";

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button type="submit" className="bni-auth-btn-primary" disabled={pending}>
      {pending ? "…" : label}
    </button>
  );
}

type Props = {
  nextPath: string;
  legacyBase: string | null;
  googleHref: string | null;
  defaultEmail: string;
  googleUsesNextPlatformOAuth?: boolean;
};

export default function LoginForm({
  nextPath,
  legacyBase,
  googleHref,
  defaultEmail,
  googleUsesNextPlatformOAuth = false,
}: Props) {
  const t = useT();
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<"invalid" | "use_google" | null>(null);
  const [emailValue, setEmailValue] = useState(defaultEmail);

  const registerHref = `/auth/register${nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`;
  const forgotHref = legacyBase ? `${legacyBase}/auth/forgot-password.php` : "#";

  const errMsg =
    errorKey === "use_google" ? t("auth.errLoginUseGoogle") : errorKey === "invalid" ? t("auth.errLoginInvalid") : null;

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
          {t("auth.email")}
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
          {t("auth.password")}
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
            {t("auth.forgotPassword")}
          </a>
        ) : (
          <span className="small text-muted">{t("auth.forgotPassword")}</span>
        )}
      </div>
      <SubmitButton pending={pending} label={t("auth.login")} />
      {googleHref ? (
        <>
          <div className="bni-auth-divider">
            <span>{t("auth.or")}</span>
          </div>
          <a href={googleHref} className="bni-auth-btn-google">
            <i className="fa-brands fa-google" aria-hidden="true" />
            {googleUsesNextPlatformOAuth ? t("auth.googlePlatform") : t("auth.google")}
          </a>
        </>
      ) : null}
      <div className="bni-auth-footer">
        <span>{t("auth.noAccount")}</span> <Link href={registerHref}>{t("auth.register")}</Link>
      </div>
    </form>
  );
}
