"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { publicApiBase } from "@/lib/client-api-base";
import { mediaUrl } from "@/lib/media-url";

type NewsListItem = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  status: string;
  featured: number;
  category: number | null;
};

function jsonHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("bni_token") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function authHeaderOnly(): HeadersInit | undefined {
  const token = typeof window !== "undefined" ? localStorage.getItem("bni_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

const CATEGORY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Зах зээлийн тайлан" },
  { value: 2, label: "Аяллын тайлан" },
  { value: 3, label: "Гарын авлага" },
  { value: 4, label: "Мэдээ" },
  { value: 5, label: "Видео" },
];

type NewsFormFields = {
  title: string;
  slug: string;
  excerpt: string;
  sourceUrl: string;
  imageUrl: string;
  category: number;
  featured: boolean;
  status: "draft" | "published";
};

const emptyForm = (): NewsFormFields => ({
  title: "",
  slug: "",
  excerpt: "",
  sourceUrl: "",
  imageUrl: "",
  category: 4,
  featured: false,
  status: "draft",
});

export default function NewsPlatformPanel() {
  const apiBase = publicApiBase();
  const editorId = "platform_news_body";

  const [items, setItems] = useState<NewsListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<NewsFormFields>(() => emptyForm());
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loadEditBusy, setLoadEditBusy] = useState(false);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm());
    setBody("");
    setMsg(null);
  }, []);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${apiBase}/platform/news?limit=80`, { headers: jsonHeaders() });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        data?: { news?: NewsListItem[] };
        message?: string;
      };
      if (!res.ok || !data.ok) {
        setMsg({ type: "err", text: data.message === "unauthorized" ? "Нэвтэрнэ үү." : "Жагсаалт ачаалахад алдаа." });
        setItems([]);
        return;
      }
      setItems(Array.isArray(data.data?.news) ? data.data!.news! : []);
    } finally {
      setListLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const loadOne = useCallback(
    async (id: number) => {
      setLoadEditBusy(true);
      setMsg(null);
      try {
        const res = await fetch(`${apiBase}/platform/news/${id}`, { headers: jsonHeaders() });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          data?: {
            id: number;
            title: string;
            slug: string;
            excerpt?: string | null;
            sourceUrl?: string;
            image?: string | null;
            status?: string;
            category?: number | null;
            featured?: number;
            body?: string | null;
            content?: string | null;
          };
        };
        if (!res.ok || !data.ok || !data.data) {
          setMsg({ type: "err", text: "Мэдээг ачаалж чадсангүй." });
          return;
        }
        const a = data.data;
        setEditingId(a.id);
        setForm({
          title: a.title || "",
          slug: a.slug || "",
          excerpt: String(a.excerpt ?? "").trim(),
          sourceUrl: String(a.sourceUrl ?? "").trim(),
          imageUrl: String(a.image ?? "").trim(),
          category: Number.isFinite(Number(a.category)) ? Number(a.category) : 4,
          featured: Number(a.featured) > 0,
          status: a.status === "published" ? "published" : "draft",
        });
        setBody(String(a.body ?? a.content ?? ""));
      } finally {
        setLoadEditBusy(false);
      }
    },
    [apiBase],
  );

  const onCoverFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f) return;
      setCoverUploading(true);
      setMsg(null);
      try {
        const fd = new FormData();
        fd.set("file", f);
        const res = await fetch(`${apiBase}/platform/news-cover-upload`, {
          method: "POST",
          body: fd,
          headers: authHeaderOnly(),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
        if (!res.ok || !data.ok || !data.url) {
          setMsg({ type: "err", text: data.error ?? "Зураг оруулахад алдаа." });
          return;
        }
        setForm((prev) => ({ ...prev, imageUrl: data.url! }));
      } finally {
        setCoverUploading(false);
      }
    },
    [apiBase],
  );

  const persist = useCallback(
    async (status: "draft" | "published") => {
      const title = form.title.trim();
      if (!title) {
        setMsg({ type: "err", text: "Гарчиг заавал бөглөнө үү." });
        return;
      }
      setSaving(true);
      setMsg(null);
      try {
        const payload = {
          title,
          slug: form.slug.trim() || undefined,
          excerpt: form.excerpt.trim() || null,
          sourceUrl: form.sourceUrl.trim() || null,
          body,
          image: form.imageUrl.trim() || null,
          status,
          category: form.category,
          featured: form.featured ? 1 : 0,
        };
        const url = editingId ? `${apiBase}/platform/news/${editingId}` : `${apiBase}/platform/news`;
        const method = editingId ? "PATCH" : "POST";
        const res = await fetch(url, { method, headers: jsonHeaders(), body: JSON.stringify(payload) });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          message?: string;
          data?: { id?: number };
        };
        if (!res.ok || !data.ok) {
          const map: Record<string, string> = {
            title_required: "Гарчиг заавал.",
            slug_conflict: "Slug давхцаж байна — өөр утга оруулна уу.",
            unauthorized: "Нэвтэрнэ үү.",
          };
          setMsg({ type: "err", text: map[data.message || ""] ?? "Хадгалахад алдаа гарлаа." });
          return;
        }
        setMsg({ type: "ok", text: status === "published" ? "Нийтлэгдлээ." : "Ноорог хадгалагдлаа." });
        setForm((p) => ({ ...p, status }));
        if (!editingId && data.data?.id) {
          setEditingId(data.data.id);
        }
        await loadList();
      } finally {
        setSaving(false);
      }
    },
    [apiBase, body, editingId, form, loadList],
  );

  const onDelete = useCallback(
    async (id: number) => {
      if (!window.confirm("Энэ мэдээг устгах уу?")) return;
      setMsg(null);
      const res = await fetch(`${apiBase}/platform/news/${id}`, { method: "DELETE", headers: jsonHeaders() });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        setMsg({ type: "err", text: "Устгахад алдаа." });
        return;
      }
      if (editingId === id) resetForm();
      setMsg({ type: "ok", text: "Устгагдлаа." });
      await loadList();
    },
    [apiBase, editingId, loadList, resetForm],
  );

  const cardTitle = editingId ? `Мэдээ засах (#${editingId})` : "Шинэ мэдээ нийтлэх";

  return (
    <>
      <div className="tps-greeting">Мэдээний удирдлага</div>
      <div className="text-muted small mb-4">Компанийн мэдээний агуулгыг үүсгэх, засах, нийтлэх — нүүр зураг оруулах боломжтой.</div>

      {msg ? (
        <div className={`alert ${msg.type === "ok" ? "alert-success" : "alert-danger"} py-2 small mb-3`} role="status">
          {msg.text}
        </div>
      ) : null}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex gap-2 flex-wrap">
          <button type="button" className="nws-btn nws-btn-primary" onClick={resetForm} disabled={saving || loadEditBusy}>
            <i className="fa-solid fa-plus" /> Шинэ мэдээ
          </button>
          <button type="button" className="nws-btn nws-btn-outline" onClick={() => void loadList()} disabled={listLoading}>
            <i className="fa-solid fa-rotate" /> Сэргээх
          </button>
        </div>
        <Link href="/news" className="small text-primary text-decoration-none fw-semibold">
          Нийтийн мэдээний хуудас →
        </Link>
      </div>

      <div className="nws-grid">
        <div className="nws-main">
          <div className="nws-card">
            <div className="nws-card-title">{cardTitle}</div>
            <div className="row g-3">
              <div className="col-md-12">
                <label className="nws-label" htmlFor="news_title">
                  Гарчиг <abbr title="Заавал">*</abbr>
                </label>
                <input
                  id="news_title"
                  type="text"
                  className="nws-input"
                  placeholder="Жагсаалтанд харагдах гарчиг"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <div className="col-md-6">
                <label className="nws-label" htmlFor="news_slug">
                  Slug (URL)
                </label>
                <div className="nws-input-group">
                  <i className="fa-solid fa-link nws-input-icon" />
                  <input
                    id="news_slug"
                    type="text"
                    className="nws-input has-icon nws-slug-input"
                    placeholder="Хоосон бол гарчгаас үүснэ"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <label className="nws-label" htmlFor="news_category">
                  Ангилал
                </label>
                <select
                  id="news_category"
                  className="nws-input"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: Number(e.target.value) }))}
                  disabled={saving}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="nws-label" htmlFor="news_source_url">
                  Эх сурвалж URL
                </label>
                <div className="nws-input-group">
                  <i className="fa-solid fa-globe nws-input-icon" />
                  <input
                    id="news_source_url"
                    type="text"
                    className="nws-input has-icon"
                    placeholder="https://"
                    value={form.sourceUrl}
                    onChange={(e) => setForm((p) => ({ ...p, sourceUrl: e.target.value }))}
                    disabled={saving}
                  />
                </div>
                <p className="small text-muted mt-1 mb-0">Товч тайлбарт &quot;Эх сурвалж:&quot; мөр болгон хадгалагдана.</p>
              </div>
              <div className="col-md-6">
                <label className="nws-label">Нүүр зураг</label>
                <input type="hidden" name="news_image" value={form.imageUrl} readOnly />
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <label
                    className={`nws-btn nws-btn-outline mb-0 ${coverUploading ? "disabled" : ""}`}
                    style={{ cursor: coverUploading ? "wait" : "pointer" }}
                  >
                    {coverUploading ? "Илгээж…" : "Зураг оруулах"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="d-none"
                      disabled={coverUploading || saving}
                      onChange={(ev) => void onCoverFile(ev)}
                    />
                  </label>
                  <input
                    type="text"
                    className="nws-input flex-grow-1"
                    style={{ minWidth: "10rem" }}
                    placeholder="Эсвэл URL гараар"
                    value={form.imageUrl}
                    onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                    disabled={saving}
                    aria-label="Нүүр зургийн холбоос"
                  />
                </div>
                {form.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(form.imageUrl)} alt="" className="nws-news-thumb mt-2" />
                ) : null}
              </div>
              <div className="col-12">
                <label className="nws-label" htmlFor="news_excerpt">
                  Товч тайлбар (excerpt)
                </label>
                <textarea
                  id="news_excerpt"
                  className="nws-input"
                  rows={3}
                  placeholder="Товч тойм..."
                  value={form.excerpt}
                  onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <div className="col-12">
                <label className="nws-label" htmlFor={editorId}>
                  Нийтлэлийн агуулга
                </label>
                <RichTextEditor
                  id={editorId}
                  name="news_body"
                  value={body}
                  onChange={setBody}
                  minHeight={280}
                  placeholder="Нийтлэлийн дэлгэрэнгүй агуулгыг энд бичнэ үү..."
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="nws-sidebar">
          <div className="nws-publish-card">
            <div className="nws-publish-body">
              <div className="fw-bold small text-muted text-uppercase mb-3">Нийтлэх</div>
              <div className="nws-status-radio mb-3">
                <label className="nws-status-item published">
                  <input
                    type="radio"
                    name="news_status"
                    checked={form.status === "published"}
                    onChange={() => setForm((p) => ({ ...p, status: "published" }))}
                    disabled={saving}
                  />
                  <span className="nws-status-label">
                    <span className="nws-status-dot" />
                    Нийтлэх
                  </span>
                </label>
                <label className="nws-status-item">
                  <input
                    type="radio"
                    name="news_status"
                    checked={form.status === "draft"}
                    onChange={() => setForm((p) => ({ ...p, status: "draft" }))}
                    disabled={saving}
                  />
                  <span className="nws-status-label">
                    <span className="nws-status-dot" />
                    Ноорог
                  </span>
                </label>
              </div>
              <label className="d-flex align-items-center gap-2 small fw-semibold text-muted mb-0">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
                  disabled={saving}
                />
                Онцлох (featured)
              </label>
            </div>
            <div className="nws-publish-footer">
              <button
                type="button"
                className="nws-btn nws-btn-primary w-100"
                disabled={saving || loadEditBusy}
                onClick={() => void persist(form.status === "published" ? "published" : "draft")}
              >
                {saving ? "Хадгалж…" : editingId ? "Өөрчлөлтийг хадгалах" : "Үүсгэх"}
              </button>
              <button type="button" className="nws-btn nws-btn-outline w-100" disabled={saving || loadEditBusy} onClick={() => void persist("draft")}>
                Ноороглох
              </button>
              <button type="button" className="nws-btn nws-btn-outline w-100" disabled={saving || loadEditBusy} onClick={() => void persist("published")}>
                Шууд нийтлэх
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="nws-table-card mt-4">
        <div className="nws-table-header">
          <span className="fw-bold small text-uppercase text-muted">Миний нийтлэлүүд</span>
        </div>
        <div className="table-responsive">
          <table className="table nws-table mb-0">
            <thead>
              <tr>
                <th>Зураг</th>
                <th>Гарчиг</th>
                <th>Төлөв</th>
                <th className="text-end">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-5 text-muted">
                    Ачаалж байна…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-5 text-muted">
                    Одоогоор нийтлэл байхгүй.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(row.image)} alt="" className="nws-news-thumb" />
                      ) : (
                        <div className="nws-news-thumb d-flex align-items-center justify-content-center text-muted small">
                          —
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="fw-semibold">{row.title}</div>
                      <div className="small text-muted font-monospace">{row.slug}</div>
                    </td>
                    <td>
                      <span className={`nws-badge ${row.status === "published" ? "published" : "draft"}`}>{row.status}</span>
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        <button
                          type="button"
                          className="nws-action-btn"
                          title="Засах"
                          disabled={loadEditBusy}
                          onClick={() => void loadOne(row.id)}
                        >
                          <i className="fa-solid fa-pen" />
                        </button>
                        <button type="button" className="nws-action-btn danger" title="Устгах" onClick={() => void onDelete(row.id)}>
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
