"use client";

import Link from "next/link";
import { useState } from "react";
import RichTextEditor from "@/components/ui/RichTextEditor";

/** PHP `?panel=news` — формын үндсэн блокууд (хадгалах API удахгүй). */

export default function NewsPlatformPanel() {
  const [body, setBody] = useState<string>("");
  const editorId = "platform_news_body";

  return (
    <>
      <div className="tps-greeting">Мэдээний удирдлага</div>
      <div className="text-muted small mb-4">Компанийн мэдээний агуулгыг удирдаж, нийтлэлийн гүйцэтгэлийг хянаарай.</div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex gap-2">
          <button type="button" className="nws-btn nws-btn-primary" disabled>
            <i className="fa-solid fa-plus" /> Шинэ мэдээ нийтлэх
          </button>
          <button type="button" className="nws-btn nws-btn-outline" disabled>
            <i className="fa-solid fa-file-import" /> Импортлох
          </button>
        </div>
        <Link href="/news" className="small text-primary text-decoration-none fw-semibold">
          Нийтийн мэдээний хуудас →
        </Link>
      </div>

      <div className="nws-grid">
        <div className="nws-main">
          <div className="nws-card">
            <div className="nws-card-title">Шинэ мэдээ нийтлэх</div>
            <div className="row g-3">
              <div className="col-md-12">
                <label className="nws-label" htmlFor="news_title">
                  Гарчиг <abbr title="Заавал">*</abbr>
                </label>
                <input id="news_title" type="text" name="news_title" className="nws-input" placeholder="Жагсаалтанд харагдах гарчиг" />
              </div>
              <div className="col-md-6">
                <label className="nws-label" htmlFor="news_slug">Slug (URL)</label>
                <div className="nws-input-group">
                  <i className="fa-solid fa-link nws-input-icon" />
                  <input id="news_slug" type="text" name="news_slug" className="nws-input has-icon nws-slug-input" placeholder="slug-oruulna" />
                </div>
              </div>
              <div className="col-md-6">
                <label className="nws-label" htmlFor="news_source_url">Эх сурвалж URL</label>
                <div className="nws-input-group">
                  <i className="fa-solid fa-globe nws-input-icon" />
                  <input id="news_source_url" type="text" name="news_source_url" className="nws-input has-icon" placeholder="https://" />
                </div>
              </div>
              <div className="col-12">
                <label className="nws-label" htmlFor="news_excerpt">Товч тайлбар (excerpt)</label>
                <textarea id="news_excerpt" name="news_excerpt" className="nws-input" rows={3} placeholder="Товч тойм..." />
              </div>
              <div className="col-12">
                <label className="nws-label" htmlFor={editorId}>Нийтлэлийн агуулга</label>
                <RichTextEditor
                  id={editorId}
                  name="news_body"
                  value={body}
                  onChange={setBody}
                  minHeight={280}
                  placeholder="Нийтлэлийн дэлгэрэнгүй агуулгыг энд бичнэ үү..."
                />
              </div>
            </div>
          </div>
        </div>
        <div className="nws-sidebar">
          <div className="nws-publish-card">
            <div className="nws-publish-body">
              <div className="fw-bold small text-muted text-uppercase mb-3">Нийтлэх</div>
              <p className="small text-muted mb-0">Төлөв сонголт, хуваарь зэрэг нэмэлт талбарууд PHP-тай адилхан шилжүүлнэ.</p>
            </div>
            <div className="nws-publish-footer">
              <button type="button" className="nws-btn nws-btn-primary w-100" disabled>
                Нийтлэх
              </button>
              <button type="button" className="nws-btn nws-btn-outline w-100" disabled>
                Ноороглох
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="nws-table-card mt-4">
        <div className="nws-table-header">
          <span className="fw-bold small text-uppercase text-muted">Нийтлэлүүдийн жагсаалт</span>
        </div>
        <div className="table-responsive">
          <table className="table nws-table mb-0">
            <thead>
              <tr>
                <th>Зураг</th>
                <th>Гарчиг</th>
                <th>Төлөв</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className="text-center py-5 text-muted">
                  Жагсаалт хоосон — хадгалах API холбогдоогүй байна.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
