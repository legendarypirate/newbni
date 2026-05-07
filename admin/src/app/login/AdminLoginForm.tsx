"use client";

import { useState } from "react";
import Link from "next/link";
import { setAuthToken } from "@/lib/api-client";
import { publicApiBase as resolveApiBase } from "@/lib/client-api-base";

const copy = {
  email: "Имэйл",
  password: "Нууц үг",
  submit: "Админ нэвтрэх",
  errInvalid: "Имэйл эсвэл нууц үг буруу байна.",
  errGoogle: "Энэ бүртгэл Google-р нэвтэрдэг. Энэ хуудас зөвхөн нууц үгтэй админд зориулагдсан.",
  errForbidden: "Энэ дансад админ эрх байхгүй байна.",
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
  defaultEmail: string;
};

export default function AdminLoginForm({ nextPath, defaultEmail }: Props) {
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<"invalid" | "use_google" | "forbidden" | null>(null);
  const [emailValue, setEmailValue] = useState(defaultEmail);

  const errMsg =
    errorKey === "use_google"
      ? copy.errGoogle
      : errorKey === "forbidden"
        ? copy.errForbidden
        : errorKey === "invalid"
          ? copy.errInvalid
          : null;

  const apiBase = resolveApiBase();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrorKey(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      const res = await fetch(`${apiBase}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.token) {
        const ek = data?.errorKey;
        setErrorKey(ek === "use_google" || ek === "forbidden" ? ek : "invalid");
        setEmailValue(email);
        return;
      }
      setAuthToken(String(data.token));
      const safeNext = nextPath.startsWith("/admin") && !nextPath.startsWith("//") ? nextPath : "/admin";
      window.location.href = safeNext;
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
        <label className="form-label" htmlFor="admin-email">
          {copy.email}
        </label>
        <div className="bni-auth-input-icon">
          <span className="bni-auth-input-ico">
            <i className="fa-solid fa-envelope" aria-hidden="true" />
          </span>
          <input
            type="email"
            className="form-control"
            id="admin-email"
            name="email"
            required
            autoComplete="email"
            placeholder="admin@busy.mn"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
          />
        </div>
      </div>
      <div className="mb-4">
        <label className="form-label" htmlFor="admin-password">
          {copy.password}
        </label>
        <div className="bni-auth-input-icon">
          <span className="bni-auth-input-ico">
            <i className="fa-solid fa-lock" aria-hidden="true" />
          </span>
          <input
            type="password"
            className="form-control"
            id="admin-password"
            name="password"
            required
            autoComplete="current-password"
          />
        </div>
      </div>
      <SubmitButton pending={pending} />
      <div className="bni-auth-footer">
        <Link href="/">Нүүр руу</Link>
        {" · "}
        <Link href="/auth/login">Платформын нэвтрэх</Link>
      </div>
    </form>
  );
}
