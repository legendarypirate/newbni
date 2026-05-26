"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthToken } from "@/lib/api-client";
import { investmentPublishLoginPath } from "@/lib/investment-publish";
import {
  computeReadinessPercent,
  createDefaultDeck,
  createSlide,
  slideFromStruct,
  structItems,
} from "@/lib/pitch-deck/templates";
import {
  loadDeck,
  loadSharedDeck,
  parseImportedDeck,
  saveDeck,
  saveSharedDeck,
  shareUrlForDeck,
} from "@/lib/pitch-deck/storage";
import { PITCH_THEMES } from "@/lib/pitch-deck/themes";
import type { PitchDeckState, PitchDeckThemeId, PitchSlide, PitchStructKey } from "@/lib/pitch-deck/types";

function accountStorageHint(): string {
  return getAuthToken() ? "user" : "guest";
}

function SlideCanvas({
  slide,
  themeId,
  fontFamily,
}: {
  slide: PitchSlide;
  themeId: PitchDeckThemeId;
  fontFamily: string;
}) {
  const theme = PITCH_THEMES[themeId];
  if (slide.layout === "image" && slide.imageDataUrl) {
    return (
      <div
        className="pd-canvas-inner"
        style={{
          background: `#111 url(${slide.imageDataUrl}) center/cover no-repeat`,
          fontFamily,
        }}
      />
    );
  }

  return (
    <div
      className="pd-canvas-inner"
      style={{ background: theme.gradient, fontFamily }}
    >
      {slide.badge ? <div className="pd-canvas-badge">{slide.badge}</div> : null}
      <h2 className="pd-canvas-title">{slide.title || "—"}</h2>
      {slide.subtitle ? <p className="pd-canvas-subtitle">{slide.subtitle}</p> : null}
      {slide.body ? <p className="pd-canvas-body">{slide.body}</p> : null}
      {slide.layout === "metrics" && slide.metrics?.length ? (
        <div className="pd-canvas-metrics">
          {slide.metrics.map((m, i) => (
            <div key={i}>
              <div className="pd-canvas-metric-val">{m.value}</div>
              <div className="pd-canvas-metric-lbl">{m.label}</div>
            </div>
          ))}
        </div>
      ) : null}
      {slide.layout === "cover" && slide.metrics?.length ? (
        <div className="pd-canvas-metrics">
          {slide.metrics.map((m, i) => (
            <div key={i}>
              <div className="pd-canvas-metric-val">{m.value}</div>
              <div className="pd-canvas-metric-lbl">{m.label}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function PitchDeckEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shareParam = searchParams.get("share");
  const readOnly = Boolean(shareParam?.trim());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importJsonRef = useRef<HTMLInputElement>(null);

  const [deck, setDeck] = useState<PitchDeckState | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);

  const storageHint = accountStorageHint();

  useEffect(() => {
    const shared = shareParam?.trim();
    if (shared) {
      const loaded = loadSharedDeck(shared);
      setDeck(loaded ?? loadDeck(storageHint));
    } else {
      setDeck(loadDeck(storageHint));
    }
  }, [shareParam, storageHint]);

  const currentSlide = deck?.slides[slideIdx] ?? null;
  const readiness = deck ? computeReadinessPercent(deck) : 0;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const persist = useCallback(
    (next: PitchDeckState, message = "Хадгалагдлаа.") => {
      const saved = { ...next, revision: next.revision + 1, updatedAt: new Date().toISOString() };
      setDeck(saved);
      if (!readOnly) saveDeck(saved, storageHint);
      if (saved.shareEnabled) saveSharedDeck(saved);
      showToast(message);
    },
    [readOnly, showToast, storageHint],
  );

  const updateSlide = useCallback(
    (patch: Partial<PitchSlide>) => {
      if (!deck || readOnly) return;
      const slides = deck.slides.map((s, i) => (i === slideIdx ? { ...s, ...patch } : s));
      const next = { ...deck, slides };
      setDeck(next);
      saveDeck(next, storageHint);
    },
    [deck, readOnly, slideIdx, storageHint],
  );

  const goSlide = useCallback(
    (i: number) => {
      if (!deck) return;
      setSlideIdx(Math.max(0, Math.min(deck.slides.length - 1, i)));
    },
    [deck],
  );

  const addSlide = useCallback(() => {
    if (!deck || readOnly) return;
    const slides = [...deck.slides, createSlide()];
    persist({ ...deck, slides }, "Шинэ слайд нэмэгдлээ.");
    setSlideIdx(slides.length - 1);
  }, [deck, persist, readOnly]);

  const deleteSlide = useCallback(() => {
    if (!deck || readOnly || deck.slides.length <= 1) return;
    const slides = deck.slides.filter((_, i) => i !== slideIdx);
    persist({ ...deck, slides }, "Слайд устгагдлаа.");
    setSlideIdx(Math.min(slideIdx, slides.length - 1));
  }, [deck, persist, readOnly, slideIdx]);

  const duplicateSlide = useCallback(() => {
    if (!deck || readOnly || !currentSlide) return;
    const copy = createSlide({ ...currentSlide, title: `${currentSlide.title} (хуулбар)` });
    const slides = [...deck.slides];
    slides.splice(slideIdx + 1, 0, copy);
    persist({ ...deck, slides }, "Слайд хуулбарлагдлаа.");
    setSlideIdx(slideIdx + 1);
  }, [currentSlide, deck, persist, readOnly, slideIdx]);

  const moveSlide = useCallback(
    (dir: -1 | 1) => {
      if (!deck || readOnly) return;
      const j = slideIdx + dir;
      if (j < 0 || j >= deck.slides.length) return;
      const slides = [...deck.slides];
      const [item] = slides.splice(slideIdx, 1);
      slides.splice(j, 0, item);
      persist({ ...deck, slides }, "Дараалал өөрчлөгдлөө.");
      setSlideIdx(j);
    },
    [deck, persist, readOnly, slideIdx],
  );

  const addFromStruct = useCallback(
    (key: PitchStructKey) => {
      if (!deck || readOnly) return;
      const slides = [...deck.slides, slideFromStruct(key)];
      persist({ ...deck, slides }, "Загвар нэмэгдлээ.");
      setSlideIdx(slides.length - 1);
    },
    [deck, persist, readOnly],
  );

  const handleSave = useCallback(() => {
    if (!deck || readOnly) return;
    persist(deck);
  }, [deck, persist, readOnly]);

  const handleShare = useCallback(() => {
    if (!deck || readOnly) return;
    const next = { ...deck, shareEnabled: true };
    saveSharedDeck(next);
    persist(next, "Нийтийн хуваалцах линк идэвхжлээ.");
    const url = shareUrlForDeck(next.shareId);
    void navigator.clipboard.writeText(url).then(() => showToast("Линк хуулагдлаа."));
  }, [deck, persist, readOnly, showToast]);

  const handleCopyLink = useCallback(() => {
    if (!deck) return;
    if (!deck.shareEnabled) {
      showToast("Эхлээд «Хуваалцах» товчийг дарж линк идэвхжүүлнэ үү.");
      return;
    }
    void navigator.clipboard.writeText(shareUrlForDeck(deck.shareId)).then(() => showToast("Линк хуулагдлаа."));
  }, [deck, showToast]);

  const handleExportJson = useCallback(() => {
    if (!deck) return;
    const blob = new Blob([JSON.stringify(deck, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${deck.title.replace(/\s+/g, "-") || "pitch-deck"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMenuOpen(false);
    showToast("JSON татагдлаа.");
  }, [deck, showToast]);

  const handleImportJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseImportedDeck(String(reader.result ?? ""));
      if (!parsed) {
        showToast("Файл буруу байна.");
        return;
      }
      persist(parsed, "Deck импортлогдлоо.");
      setSlideIdx(0);
    };
    reader.readAsText(file);
  }, [persist, showToast]);

  const handleImageImport = useCallback(
    (file: File) => {
      if (!deck || readOnly) return;
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result ?? "");
        const slides = [
          ...deck.slides,
          createSlide({
            layout: "image",
            title: file.name,
            imageDataUrl: url,
            body: "",
          }),
        ];
        persist({ ...deck, slides }, "Зураг нэмэгдлээ.");
        setSlideIdx(slides.length - 1);
      };
      reader.readAsDataURL(file);
    },
    [deck, persist, readOnly],
  );

  const improveContent = useCallback(() => {
    if (!deck || readOnly || !currentSlide) return;
    const body = (currentSlide.body ?? "").trim();
    if (!body) {
      showToast("Эхлээд агуулга бичнэ үү.");
      return;
    }
    const improved =
      body.length < 80
        ? `${body}\n\nЭнэхүү сегментэд хөрөнгө оруулагчдад ойлгомжтой, тоогоор баталгаажсан мэдээлэл нэмэхийг зөвлөж байна.`
        : body.replace(/\s+/g, " ").trim();
    updateSlide({ body: improved });
    showToast("Агуулга сайжрууллаа.");
  }, [currentSlide, deck, readOnly, showToast, updateSlide]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || t?.tagName === "SELECT") return;
      if (previewOpen) {
        if (e.key === "ArrowLeft") setPreviewIdx((i) => Math.max(0, i - 1));
        if (e.key === "ArrowRight" && deck) setPreviewIdx((i) => Math.min(deck.slides.length - 1, i + 1));
        if (e.key === "Escape") setPreviewOpen(false);
        return;
      }
      if (e.key === "ArrowLeft") goSlide(slideIdx - 1);
      if (e.key === "ArrowRight") goSlide(slideIdx + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [deck, goSlide, previewOpen, slideIdx]);

  const checklist = useMemo(() => {
    if (!deck) return [];
    const labels = [
      { key: "cover", label: "Cover slide", ok: deck.slides.some((s) => s.layout === "cover") },
      { key: "problem", label: "Problem & Solution", ok: deck.slides.length >= 3 },
      { key: "market", label: "Market size", ok: deck.slides.some((s) => /зах зээл/i.test(s.title + s.body)) },
      { key: "biz", label: "Business model", ok: deck.slides.some((s) => /бизнес/i.test(s.title + s.body)) },
      { key: "fin", label: "Financials", ok: deck.slides.some((s) => s.layout === "metrics") },
      { key: "team", label: "Team", ok: deck.slides.some((s) => /баг/i.test(s.title + s.body)) },
    ];
    return labels;
  }, [deck]);

  if (!deck) {
    return (
      <div className="container py-5 text-center text-muted">
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden />
        Pitch Deck ачаалж байна…
      </div>
    );
  }

  return (
    <div id="pdDeckRoot" className="container pd-layout mt-4">
      {toast ? (
        <div className="pd-toast" role="status">
          {toast}
        </div>
      ) : null}

      <aside className="pd-sidebar-left">
        <div className="pd-sidebar-header">
          <div className="small fw-bold text-dark">Слайдууд ({deck.slides.length})</div>
          {!readOnly ? (
            <button type="button" onClick={addSlide} className="btn btn-sm btn-primary py-0 px-2" style={{ fontSize: "0.65rem" }}>
              <i className="fa-solid fa-plus" /> Нэмэх
            </button>
          ) : null}
        </div>
        <div className="pd-slide-list">
          {deck.slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`pd-slide-thumb ${i === slideIdx ? "active" : ""}`}
              onClick={() => goSlide(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goSlide(i);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="pd-slide-num">{i + 1}</div>
              <div
                className="pd-slide-img"
                style={{ background: PITCH_THEMES[deck.themeId].gradient, display: "grid", placeItems: "center", padding: 8 }}
              >
                <span className="pd-thumb-label">{slide.title || `Слайд ${i + 1}`}</span>
              </div>
            </div>
          ))}
        </div>
        {!readOnly ? (
          <div className="p-3 border-top mt-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="d-none"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageImport(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="btn btn-sm btn-light border w-100 fw-bold"
              style={{ fontSize: "0.7rem" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="fa-solid fa-upload me-1" /> Зураг импортлох
            </button>
          </div>
        ) : null}
      </aside>

      <div className="pd-main">
        <div className="pd-main-header">
          <div className="pd-title-area">
            <Link href="/investments" className="btn btn-sm btn-light border me-2" title="Буцах" aria-label="Буцах">
              <i className="fa-solid fa-chevron-left" />
            </Link>
            {titleEditing && !readOnly ? (
              <input
                className="form-control form-control-sm fw-bold"
                value={deck.title}
                onChange={(e) => setDeck({ ...deck, title: e.target.value })}
                onBlur={() => {
                  setTitleEditing(false);
                  persist(deck);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setTitleEditing(false);
                    persist(deck);
                  }
                }}
                autoFocus
              />
            ) : (
              <h2 className="h5 fw-bold mb-0">
                {deck.title}{" "}
                {!readOnly ? (
                  <button type="button" className="btn btn-link btn-sm p-0 align-baseline text-muted" onClick={() => setTitleEditing(true)} aria-label="Нэр засах">
                    <i className="fa-solid fa-pen" style={{ fontSize: "0.75rem" }} />
                  </button>
                ) : null}
              </h2>
            )}
            <span className="pd-version">v{deck.revision}</span>
          </div>
          <div className="d-flex gap-2 flex-wrap justify-content-end">
            {!readOnly ? (
              <>
                <button type="button" className="dlr-action-btn" onClick={handleSave}>
                  <i className="fa-regular fa-floppy-disk" /> Хадгалах
                </button>
                <button type="button" className="dlr-action-btn" onClick={() => { setPreviewIdx(slideIdx); setPreviewOpen(true); }}>
                  <i className="fa-regular fa-eye" /> Урьдчилан харах
                </button>
                <button type="button" className="dlr-action-btn dlr-action-btn-primary" onClick={handleShare}>
                  <i className="fa-solid fa-paper-plane" /> Хуваалцах
                </button>
                <div className="position-relative">
                  <button type="button" className="dlr-action-btn" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen}>
                    <i className="fa-solid fa-ellipsis" />
                  </button>
                  {menuOpen ? (
                    <div className="pd-menu-dropdown">
                      <button type="button" onClick={handleExportJson}>JSON татах</button>
                      <button type="button" onClick={() => importJsonRef.current?.click()}>JSON импортлох</button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Бүх өөрчлөлтийг устгаж, анхны загвар руу буцах уу?")) {
                            persist(createDefaultDeck(), "Анхны загвар сэргээгдлээ.");
                            setSlideIdx(0);
                          }
                          setMenuOpen(false);
                        }}
                      >
                        Анхны загвар
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <span className="badge bg-light text-muted border">Зөвхөн унших горим</span>
            )}
          </div>
        </div>

        <input
          ref={importJsonRef}
          type="file"
          accept="application/json,.json"
          className="d-none"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportJson(f);
            e.target.value = "";
          }}
        />

        <div className="pd-stats-row">
          <div className="pd-stat-card">
            <div className="pd-stat-info">
              <div className="pd-stat-lbl">Нийт слайд</div>
              <div className="pd-stat-val">{deck.slides.length}</div>
            </div>
            <i className="fa-regular fa-copy pd-stat-icon" role="button" tabIndex={0} title="Слайд тоо хуулах" onClick={() => void navigator.clipboard.writeText(String(deck.slides.length))} />
          </div>
          <div className="pd-stat-card">
            <div className="pd-stat-info">
              <div className="pd-stat-lbl">Бэлэн байдал</div>
              <div className="pd-stat-val">{readiness}%</div>
            </div>
            <i className="fa-solid fa-chart-line pd-stat-icon text-success" />
          </div>
          <div className="pd-stat-card">
            <div className="pd-stat-info">
              <div className="pd-stat-lbl">Сүүлд хадгалсан</div>
              <div className="pd-stat-val" style={{ fontSize: "0.7rem" }}>
                {new Date(deck.updatedAt).toLocaleString("mn-MN")}
              </div>
            </div>
            <i className="fa-regular fa-clock pd-stat-icon" />
          </div>
          <div className="pd-stat-card">
            <div className="pd-stat-info">
              <div className="pd-stat-lbl">Статус</div>
              <div className={`pd-stat-val ${deck.shareEnabled ? "text-success" : ""}`} style={{ fontSize: "0.75rem" }}>
                {deck.shareEnabled ? "Нийтийн линк идэвхтэй" : "Хувийн"}
              </div>
            </div>
            <i className={`fa-solid fa-link pd-stat-icon ${deck.shareEnabled ? "text-success" : ""}`} />
          </div>
        </div>

        <div className="pd-preview-area">
          <div className="pd-canvas-wrap">
            <div className="pd-canvas">
              <div
                className="pd-canvas-scaler"
                style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.2s" }}
              >
                {currentSlide ? (
                  <SlideCanvas slide={currentSlide} themeId={deck.themeId} fontFamily={deck.fontFamily} />
                ) : null}
              </div>
            </div>
            <div className="pd-canvas-nav">
              <button type="button" className="btn btn-sm btn-link text-muted" onClick={() => goSlide(slideIdx - 1)} disabled={slideIdx <= 0}>
                <i className="fa-solid fa-chevron-left" />
              </button>
              <span>
                {slideIdx + 1} / {deck.slides.length}
              </span>
              <button type="button" className="btn btn-sm btn-link text-muted" onClick={() => goSlide(slideIdx + 1)} disabled={slideIdx >= deck.slides.length - 1}>
                <i className="fa-solid fa-chevron-right" />
              </button>
              {!readOnly ? (
                <>
                  <button type="button" className="btn btn-sm btn-link text-muted" onClick={() => moveSlide(-1)} disabled={slideIdx <= 0} title="Дээш">
                    <i className="fa-solid fa-arrow-up" />
                  </button>
                  <button type="button" className="btn btn-sm btn-link text-muted" onClick={() => moveSlide(1)} disabled={slideIdx >= deck.slides.length - 1} title="Доош">
                    <i className="fa-solid fa-arrow-down" />
                  </button>
                  <button type="button" className="btn btn-sm btn-link text-muted" onClick={duplicateSlide} title="Хуулбарлах">
                    <i className="fa-regular fa-copy" />
                  </button>
                  <button type="button" className="btn btn-sm btn-link text-danger" onClick={deleteSlide} disabled={deck.slides.length <= 1}>
                    <i className="fa-regular fa-trash-can" />
                  </button>
                </>
              ) : null}
              <div className="ms-auto d-flex align-items-center gap-3">
                <button type="button" className="btn btn-sm btn-link text-muted p-0" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>
                  <i className="fa-solid fa-minus" />
                </button>
                <span>{Math.round(zoom * 100)}%</span>
                <button type="button" className="btn btn-sm btn-link text-muted p-0" onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}>
                  <i className="fa-solid fa-plus" />
                </button>
                <button type="button" className="btn btn-sm btn-link text-muted p-0" onClick={() => { setPreviewIdx(slideIdx); setPreviewOpen(true); }} title="Бүтэн дэлгэц">
                  <i className="fa-solid fa-expand" />
                </button>
              </div>
            </div>
          </div>

          {!readOnly && currentSlide ? (
            <div className="pd-settings-pane">
              <div className="pd-setting-group">
                <label className="pd-setting-lbl" htmlFor="pd-slide-title">Гарчиг</label>
                <input id="pd-slide-title" className="form-control form-control-sm" value={currentSlide.title} onChange={(e) => updateSlide({ title: e.target.value })} />
              </div>
              {currentSlide.layout === "cover" ? (
                <div className="pd-setting-group">
                  <label className="pd-setting-lbl" htmlFor="pd-slide-sub">Дэд гарчиг</label>
                  <input id="pd-slide-sub" className="form-control form-control-sm" value={currentSlide.subtitle ?? ""} onChange={(e) => updateSlide({ subtitle: e.target.value })} />
                </div>
              ) : null}
              <div className="pd-setting-group">
                <label className="pd-setting-lbl" htmlFor="pd-slide-body">Агуулга</label>
                <textarea id="pd-slide-body" className="form-control form-control-sm" rows={5} value={currentSlide.body ?? ""} onChange={(e) => updateSlide({ body: e.target.value })} />
              </div>
              <div className="pd-setting-group">
                <label className="pd-setting-lbl">Загвар</label>
                <select
                  className="form-select form-select-sm border-light bg-light fw-bold"
                  style={{ fontSize: "0.75rem" }}
                  value={deck.layoutStyle}
                  onChange={(e) => setDeck({ ...deck, layoutStyle: e.target.value })}
                  onBlur={() => persist(deck)}
                >
                  <option value="modern">Modern Pro</option>
                  <option value="dark">Investor Dark</option>
                  <option value="minimal">Clean Minimal</option>
                </select>
              </div>
              <div className="pd-setting-group">
                <label className="pd-setting-lbl">Өнгөний схем</label>
                <div className="d-flex gap-2 flex-wrap">
                  {(Object.keys(PITCH_THEMES) as PitchDeckThemeId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={`pd-color-swatch ${deck.themeId === id ? "active" : ""}`}
                      style={{ background: PITCH_THEMES[id].swatch }}
                      title={PITCH_THEMES[id].label}
                      onClick={() => {
                        const next = { ...deck, themeId: id };
                        setDeck(next);
                        persist(next, "Өнгө шинэчлэгдлээ.");
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="pd-setting-group">
                <label className="pd-setting-lbl">Фонт</label>
                <select
                  className="form-select form-select-sm border-light bg-light"
                  style={{ fontSize: "0.75rem" }}
                  value={deck.fontFamily}
                  onChange={(e) => {
                    const next = { ...deck, fontFamily: e.target.value };
                    setDeck(next);
                    persist(next);
                  }}
                >
                  <option value="Nunito">Nunito</option>
                  <option value="Roboto, sans-serif">Roboto</option>
                  <option value="Inter, sans-serif">Inter</option>
                </select>
              </div>
              <div className="pd-setting-group border-top pt-3">
                <label className="pd-setting-lbl text-primary">
                  <i className="fa-solid fa-wand-magic-sparkles me-1" /> AI Сайжруулалт
                </label>
                <button type="button" className="btn btn-sm btn-outline-primary w-100 mb-2 py-2 text-start" style={{ fontSize: "0.7rem" }} onClick={improveContent}>
                  <i className="fa-solid fa-pen-nib me-2" /> Агуулга сайжруулах
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary w-100 py-2 text-start"
                  style={{ fontSize: "0.7rem" }}
                  onClick={() => showToast("Дизайн зөвлөмж: Cover + Problem + Market + Financials слайдуудыг заавал оруулна уу.")}
                >
                  <i className="fa-solid fa-palette me-2" /> Дизайн зөвлөмж
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="small fw-bold text-dark mb-3">
          Deck бүтэц <span className="text-muted fw-normal" style={{ fontSize: "0.65rem" }}>(Дарах = шинэ слайд нэмнэ)</span>
        </div>
        <div className="pd-struct-grid">
          {structItems().map((item) => (
            <button key={item.key} type="button" className="pd-struct-item border-0" onClick={() => addFromStruct(item.key)} disabled={readOnly}>
              <i className={`${item.icon} pd-struct-icon text-primary`} />
              <span className="pd-struct-lbl">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <aside className="pd-sidebar-right">
        <div className="inv-sidebar-left mb-4">
          <div className="dlr-card-title text-uppercase mb-4" style={{ fontSize: "0.75rem" }}>Pitch Deck бэлэн байдал</div>
          <div className="dlr-status-circle">
            <svg viewBox="0 0 36 36" className="dlr-status-svg">
              <path className="dlr-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style={{ fill: "none", stroke: "#f1f5f9", strokeWidth: 3 }} />
              <path
                className="dlr-circle-fill"
                strokeDasharray={`${readiness}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                style={{ fill: "none", stroke: "#2563eb", strokeWidth: 3, strokeLinecap: "round" }}
              />
            </svg>
            <div className="dlr-status-percent">
              <span className="dlr-status-val">{readiness}%</span>
              <span className="dlr-status-lbl">Бэлэн</span>
            </div>
          </div>
          <p className="small text-muted text-center mb-4">Deck-ээ илүү хүчтэй болгохын тулд доорх хэсгүүдийг гүйцээнэ үү.</p>
          <div className="dlr-checklist mb-4">
            {checklist.map((c) => (
              <div key={c.key} className="dlr-checklist-item border-0 py-2">
                <div className="small text-muted">{c.label}</div>
                <i className={`fa-solid ${c.ok ? "fa-circle-check text-success" : "fa-circle text-muted opacity-25"}`} />
              </div>
            ))}
          </div>
          {!readOnly ? (
            <>
              <button
                type="button"
                className="btn btn-primary w-100 mb-2 py-2 fw-bold"
                style={{ borderRadius: "12px", fontSize: "0.85rem" }}
                onClick={() => {
                  handleSave();
                  if (!getAuthToken()) {
                    router.push(investmentPublishLoginPath());
                    return;
                  }
                  showToast("Deck хадгалагдлаа. Хөрөнгө оруулагчидтай хуваалцахад «Хуваалцах» ашиглана уу.");
                }}
              >
                <i className="fa-solid fa-paper-plane me-2" /> Deck-ээ илгээх
              </button>
              <button type="button" className="btn btn-light border w-100 py-2 fw-bold" style={{ borderRadius: "12px", fontSize: "0.85rem" }} onClick={handleCopyLink}>
                <i className="fa-regular fa-copy me-2" /> Хуваалцах линкийг хуулах
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="btn btn-primary w-100 text-decoration-none">
              Засварлахын тулд нэвтрэх
            </Link>
          )}
        </div>
      </aside>

      {previewOpen && deck ? (
        <div className="pd-preview-modal" role="dialog" aria-modal="true">
          <div className="pd-preview-modal-bar">
            <span>
              Урьдчилан харах — {previewIdx + 1} / {deck.slides.length}
            </span>
            <button type="button" className="btn btn-sm btn-light" onClick={() => setPreviewOpen(false)}>
              Хаах
            </button>
          </div>
          <div className="pd-preview-modal-body">
            <button type="button" className="pd-preview-nav-btn" onClick={() => setPreviewIdx((i) => Math.max(0, i - 1))} disabled={previewIdx <= 0}>
              <i className="fa-solid fa-chevron-left" />
            </button>
            <div className="pd-preview-modal-slide">
              <SlideCanvas slide={deck.slides[previewIdx]} themeId={deck.themeId} fontFamily={deck.fontFamily} />
            </div>
            <button
              type="button"
              className="pd-preview-nav-btn"
              onClick={() => setPreviewIdx((i) => Math.min(deck.slides.length - 1, i + 1))}
              disabled={previewIdx >= deck.slides.length - 1}
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
