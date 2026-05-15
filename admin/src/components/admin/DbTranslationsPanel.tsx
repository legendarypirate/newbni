"use client";

import { useState } from "react";
import { publicApiBase } from "@/lib/client-api-base";
import { getAuthToken } from "@/lib/api-client";

const ENTITY_TYPES = [
  { id: "trip", label: "Аялал (business_trips)" },
  { id: "event", label: "Эвент (bni_events)" },
  { id: "news", label: "Мэдээ (news)" },
] as const;

export default function DbTranslationsPanel() {
  const [entityType, setEntityType] = useState<(typeof ENTITY_TYPES)[number]["id"]>("trip");
  const [entityId, setEntityId] = useState("");
  const [batchLimit, setBatchLimit] = useState("20");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function post(path: string, body: Record<string, unknown>) {
    const token = getAuthToken();
    const res = await fetch(`${publicApiBase()}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; count?: number };
    if (!res.ok || !data.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  }

  async function onTranslateOne(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await post("/admin/translations/auto", {
        entityType,
        entityId: entityId.trim(),
        targetLangs: ["en", "cn", "kr", "jp"],
      });
      setMsg("Орчуулга хадгалагдлаа (EN, CN, KR, JP).");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Алдаа");
    } finally {
      setBusy(false);
    }
  }

  async function onTranslateBatch() {
    setBusy(true);
    setMsg(null);
    try {
      const data = await post("/admin/translations/auto-batch", {
        entityType,
        limit: Number.parseInt(batchLimit, 10) || 20,
      });
      setMsg(`Сүүлийн ${data.count ?? 0} бичлэгийг EN рүү орчуулж хадгаллаа.`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Алдаа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-muted small mb-4">
        Монгол эх контентыг <code>bni_content_translations</code> хүснэгтэд хадгална. Нүүр хуудасны хэл сонголтоор API
        орчуулсан талбарыг буцаана. Эхлээд SQL migration ажиллуулна:{" "}
        <code>backend/sql/bni-content-translations.sql</code>
      </p>

      {msg ? <div className="alert alert-info">{msg}</div> : null}

      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h6 fw-semibold mb-3">Нэг бичлэг</h2>
          <form onSubmit={onTranslateOne} className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label small">Төрөл</label>
              <select
                className="form-select"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as typeof entityType)}
              >
                {ENTITY_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small">ID</label>
              <input
                className="form-control"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="жишээ нь 11"
                required
              />
            </div>
            <div className="col-md-4">
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "…" : "AI-р орчуулах (EN/CN/KR/JP)"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="h6 fw-semibold mb-3">Багц (сүүлийн N)</h2>
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label small">Төрөл</label>
              <select
                className="form-select"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as typeof entityType)}
              >
                {ENTITY_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small">Тоо</label>
              <input className="form-control" value={batchLimit} onChange={(e) => setBatchLimit(e.target.value)} />
            </div>
            <div className="col-md-4">
              <button
                type="button"
                className="btn btn-outline-primary"
                disabled={busy}
                onClick={() => void onTranslateBatch()}
              >
                {busy ? "…" : "Сүүлийн бичлэгүүд → EN"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
