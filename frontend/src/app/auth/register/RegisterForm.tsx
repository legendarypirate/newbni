"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import type { RegisterFormState } from "./actions";
import { registerAction } from "./actions";

const initial: RegisterFormState = { errorKey: null, displayName: "", email: "" };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="bni-auth-btn-primary" disabled={pending}>
      {pending ? "…" : label}
    </button>
  );
}

type Props = {
  nextPath: string;
  googleHref: string | null;
  googleUsesNextPlatformOAuth?: boolean;
  defaultEmail?: string;
  defaultDisplayName?: string;
};

export default function RegisterForm({
  nextPath,
  googleHref,
  googleUsesNextPlatformOAuth = false,
  defaultEmail = "",
  defaultDisplayName = "",
}: Props) {
  const t = useT();
  const [state, formAction] = useActionState(registerAction, {
    ...initial,
    email: defaultEmail,
    displayName: defaultDisplayName,
  });

  const loginHref = `/auth/login${nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`;

  const errMsg =
    state.errorKey === "invalid"
      ? t("auth.errInvalid")
      : state.errorKey === "password_mismatch"
        ? t("auth.errPasswordMismatch")
        : state.errorKey === "password_weak"
          ? t("auth.errPasswordWeak")
          : state.errorKey === "terms_required"
            ? t("auth.errTerms")
            : state.errorKey === "email_taken"
              ? t("auth.errEmailTaken")
              : state.errorKey === "use_google"
                ? t("auth.errUseGoogle")
                : state.errorKey === "account_inactive"
                  ? t("auth.errInactive")
                  : state.errorKey === "server_error"
                    ? t("auth.errServer")
                    : null;

  return (
    <form action={formAction} className="mb-0">
      <input type="hidden" name="next" value={nextPath} />
      {errMsg ? (
        <div className="alert alert-danger bni-auth-alert bni-auth-register-alert" role="alert">
          {errMsg}
        </div>
      ) : null}
      <div className="bni-auth-register-fields">
        <div className="bni-auth-field">
          <label className="form-label" htmlFor="displayName">
            {t("auth.displayName")}
          </label>
          <div className="bni-auth-input-icon">
            <span className="bni-auth-input-ico">
              <i className="fa-solid fa-user" aria-hidden="true" />
            </span>
            <input
              type="text"
              className="form-control"
              id="displayName"
              name="displayName"
              required
              autoComplete="name"
              maxLength={255}
              placeholder={t("auth.placeholderName")}
              defaultValue={state.displayName || defaultDisplayName}
            />
          </div>
        </div>
        <div className="bni-auth-field">
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
              defaultValue={state.email || defaultEmail}
            />
          </div>
        </div>
        <div className="bni-auth-field">
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
              autoComplete="new-password"
              minLength={8}
              aria-describedby="passwordHelp"
            />
          </div>
          <div id="passwordHelp" className="form-text">
            {t("auth.passwordHint")}
          </div>
        </div>
        <div className="bni-auth-field">
          <label className="form-label" htmlFor="passwordConfirm">
            {t("auth.passwordConfirm")}
          </label>
          <div className="bni-auth-input-icon">
            <span className="bni-auth-input-ico">
              <i className="fa-solid fa-lock" aria-hidden="true" />
            </span>
            <input
              type="password"
              className="form-control"
              id="passwordConfirm"
              name="passwordConfirm"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
        </div>
      </div>
      <div className="bni-auth-register-terms">
        <div className="form-check">
          <input className="form-check-input" type="checkbox" name="terms" id="terms" value="on" required />
          <label className="form-check-label small" htmlFor="terms">
            {t("auth.termsPrefix")}
            <Link href="#" className="text-primary text-decoration-none">
              {t("footer.links.terms")}
            </Link>
            {t("auth.termsAnd")}
            <Link href="#" className="text-primary text-decoration-none">
              {t("footer.links.privacy")}
            </Link>
            {t("auth.termsSuffix")}
          </label>
        </div>
      </div>
      <SubmitButton label={t("auth.register")} />
      {googleHref ? (
        <>
          <div className="bni-auth-divider bni-auth-register-divider">
            <span>{t("auth.or")}</span>
          </div>
          <a href={googleHref} className="bni-auth-btn-google">
            <i className="fa-brands fa-google" aria-hidden="true" />
            {googleUsesNextPlatformOAuth ? t("auth.googlePlatform") : t("auth.google")}
          </a>
        </>
      ) : null}
      <div className="bni-auth-footer bni-auth-register-footer">
        <span>{t("auth.hasAccount")}</span> <Link href={loginHref}>{t("auth.login")}</Link>
      </div>
    </form>
  );
}
