"use client";

import { useEffect, useRef } from "react";

export type ConfirmDialogProps = {
  open: boolean;
  /** Heading shown above the message. */
  title: string;
  /** Body copy. Plain text or pre-formatted JSX. */
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" = red confirm button, "primary" = blue (default). */
  tone?: "danger" | "primary";
  /** Disable the buttons while a request is in flight. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Small accessible confirmation modal — backdrop click and Escape both
 * cancel; Enter triggers confirm. Bootstrap-friendly classes so it fits
 * the existing platform UI.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Тийм",
  cancelLabel = "Болих",
  tone = "primary",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    confirmBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
      if (e.key === "Enter" && !busy) onConfirm();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel, onConfirm]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const confirmClass = tone === "danger" ? "btn btn-danger" : "btn btn-primary";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="busy-confirm-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        zIndex: 1080,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          maxWidth: 440,
          width: "100%",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.25)",
          overflow: "hidden",
          animation: "busyConfirmIn 140ms ease-out",
        }}
      >
        <style>{`
          @keyframes busyConfirmIn {
            from { transform: translateY(8px); opacity: 0; }
            to   { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <div style={{ padding: "1.25rem 1.25rem 0.5rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <div
            style={{
              flex: "0 0 auto",
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: tone === "danger" ? "#fee2e2" : "#dbeafe",
              color: tone === "danger" ? "#b91c1c" : "#1d4ed8",
              fontSize: "1.1rem",
            }}
            aria-hidden="true"
          >
            <i className={tone === "danger" ? "fa-solid fa-triangle-exclamation" : "fa-solid fa-circle-question"} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 id="busy-confirm-title" style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
              {title}
            </h2>
            <div style={{ marginTop: "0.4rem", fontSize: "0.9rem", color: "#475569", lineHeight: 1.5 }}>
              {message}
            </div>
          </div>
        </div>

        <div style={{ padding: "1rem 1.25rem 1.25rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-light" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={confirmClass}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Уншиж байна…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
