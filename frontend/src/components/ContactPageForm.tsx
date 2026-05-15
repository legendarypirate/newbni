"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";

type FormState = "idle" | "submitting" | "success" | "error";

export function ContactPageForm() {
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<FormState>("idle");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (status !== "success") return;
    const timer = window.setTimeout(() => setStatus("idle"), 5000);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorText("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message, website: honeypot }),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data === "object" && data && "error" in data && typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : t("contact.form.errSend");
        setErrorText(msg);
        setStatus("error");
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setErrorText(t("contact.form.errNetwork"));
      setStatus("error");
    }
  }

  return (
    <div className="rounded-3 border bg-white p-4 p-md-5 shadow-sm">
      <h2 className="h5 fw-bold mb-1">{t("contact.form.title")}</h2>
      <p className="text-muted small mb-4">{t("contact.form.lead")}</p>

      {status === "success" ? (
        <div>
          <div
            className="alert alert-success d-flex align-items-start gap-2 mb-3 border-0 shadow-sm py-3"
            role="status"
            aria-live="polite"
          >
            <i className="fa-solid fa-circle-check mt-1 flex-shrink-0" aria-hidden />
            <div>
              <strong className="d-block">{t("contact.form.successTitle")}</strong>
              <span className="small">{t("contact.form.successBody")}</span>
            </div>
          </div>
          <button type="button" className="btn-brand-outline w-100 py-2" onClick={() => setStatus("idle")}>
            {t("contact.form.newMessage")}
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <div className="visually-hidden" aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input
              id="contact-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(ev) => setHoneypot(ev.target.value)}
            />
          </div>

          {status === "error" && errorText ? (
            <div className="alert alert-danger py-2 small" role="alert">
              {errorText}
            </div>
          ) : null}

          <div className="mb-3">
            <label htmlFor="contact-name" className="form-label small fw-semibold">
              {t("contact.form.name")} <span className="text-danger">*</span>
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              className="form-control"
              autoComplete="name"
              required
              maxLength={200}
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              disabled={status === "submitting"}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="contact-email" className="form-label small fw-semibold">
              {t("contact.form.email")} <span className="text-danger">*</span>
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              className="form-control"
              autoComplete="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              disabled={status === "submitting"}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="contact-phone" className="form-label small fw-semibold">
              {t("contact.form.phone")}{" "}
              <span className="text-muted fw-normal">{t("contact.form.phoneOptional")}</span>
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              className="form-control"
              autoComplete="tel"
              maxLength={40}
              value={phone}
              onChange={(ev) => setPhone(ev.target.value)}
              disabled={status === "submitting"}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="contact-message" className="form-label small fw-semibold">
              {t("contact.form.message")} <span className="text-danger">*</span>
            </label>
            <textarea
              id="contact-message"
              name="message"
              className="form-control"
              rows={5}
              required
              minLength={10}
              maxLength={4000}
              value={message}
              onChange={(ev) => setMessage(ev.target.value)}
              disabled={status === "submitting"}
              placeholder={t("contact.form.messagePlaceholder")}
            />
            <div className="form-text">{t("contact.form.messageHint")}</div>
          </div>

          <button type="submit" className="btn-brand w-100 py-2" disabled={status === "submitting"}>
            {status === "submitting" ? t("contact.form.submitting") : t("contact.form.submit")}
          </button>
        </form>
      )}
    </div>
  );
}
