"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";

type Props = {
  kind: "trip" | "event";
  id: string | number;
  onDone?: () => void;
};

export default function ContentApprovalButtons({ kind, id, onDone }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(action: "approve" | "reject") {
    setBusy(true);
    setMsg(null);
    try {
      const path =
        kind === "trip"
          ? `/admin/trips/${encodeURIComponent(String(id))}/approval`
          : `/admin/events/${encodeURIComponent(String(id))}/approval`;
      const res = await apiFetch(path, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        setMsg("Алдаа гарлаа.");
        return;
      }
      setMsg(action === "approve" ? "Зөвшөөрлөө." : "Татгалзлаа.");
      onDone?.();
    } catch {
      setMsg("Сүлжээний алдаа.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="d-inline-flex flex-column align-items-end gap-1">
      <div className="d-inline-flex gap-1">
        <button
          type="button"
          className="btn btn-sm btn-success"
          disabled={busy}
          onClick={() => void run("approve")}
        >
          Зөвшөөрөх
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          disabled={busy}
          onClick={() => void run("reject")}
        >
          Татгалзах
        </button>
      </div>
      {msg ? <span className="small text-muted">{msg}</span> : null}
    </div>
  );
}
