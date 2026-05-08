import Link from "next/link";

import SafeImage from "@/components/SafeImage";
import { companyIconForIndustry, loadCompaniesList } from "@/lib/companies-data";
import { mediaUrl } from "@/lib/media-url";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ kw?: string }> };

export default async function CompaniesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const compKw = (sp.kw ?? "").trim();
  const compMailto = "mailto:info@busy.mn";
  const compLogin = "/auth/login";
  const compResultsHref = "/companies#factory-results";

  const { rows, total, featured } = await loadCompaniesList({ q: compKw });
  const featuredIcon = companyIconForIndustry(featured?.industry ?? null);

  return (
    <main className="page-content" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* Hero Section */}
      <section className="pt-5 pb-4" style={{ background: "url('/assets/img/busy-background.png') no-repeat center top", backgroundSize: "cover", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.85)", zIndex: 1 }}></div>

        <div className="container position-relative" style={{ zIndex: 2 }}>
          <h1 className="fw-bold" style={{ fontSize: "2.25rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>Үйлдвэр холболт</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>Хятад, Солонгос болон бусад зах зээлээс үйлдвэрлэгч, ханган нийлүүлэгч, OEM түнш олох</p>

          {/* Search Bar — submits as `?kw=…`, the page re-renders with filtered DB rows. */}
          <form className="factory-search-box" method="get" action="/companies">
            <i className="fa-solid fa-magnifying-glass ms-3" style={{ color: "var(--text-muted)" }}></i>
            <input type="text" className="factory-search-input" name="kw" defaultValue={compKw} placeholder="Бараа, үйлдвэр, улс, хот, MOQ хайх..." />
            <select className="factory-search-select" name="country">
              <option value="">Бүх улс</option>
              <option value="cn">БНХАУ</option>
              <option value="kr">БНСУ</option>
              <option value="vn">Вьетнам</option>
            </select>
            <button type="submit" className="btn-brand factory-search-btn">Хайх</button>
          </form>

          <div className="top-category-cards">
            <Link href={compResultsHref} className="top-category-card">
              <div className="top-category-icon"><i className="fa-solid fa-industry"></i></div>
              <div className="top-category-text">
                <div className="top-category-title">Үйлдвэрүүд</div>
                <div className="top-category-desc">Үйлдвэрлэгч компаниудыг хайх</div>
              </div>
            </Link>
            <Link href={compResultsHref} className="top-category-card">
              <div className="top-category-icon"><i className="fa-regular fa-user"></i></div>
              <div className="top-category-text">
                <div className="top-category-title">Ханган нийлүүлэгчид</div>
                <div className="top-category-desc">Бараа нийлүүлэгчдийг олох</div>
              </div>
            </Link>
            <Link href={compResultsHref} className="top-category-card">
              <div className="top-category-icon"><i className="fa-solid fa-gear"></i></div>
              <div className="top-category-text">
                <div className="top-category-title">OEM/ODM</div>
                <div className="top-category-desc">OEM/ODM түншүүдтэй холбогдох</div>
              </div>
            </Link>
            <Link href={compResultsHref} className="top-category-card">
              <div className="top-category-icon"><i className="fa-solid fa-bullseye"></i></div>
              <div className="top-category-text">
                <div className="top-category-title">Сүүлийн match</div>
                <div className="top-category-desc">Танд санал болгосон matches</div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <div className="container factories-layout">

        {/* Left Sidebar: Filter — purely visual, not wired to backend yet. */}
        <aside className="factories-sidebar-left">
          <div className="factory-widget">
            <h3 className="factory-widget-title">Шүүлтүүр <span style={{ fontSize: "0.75rem", color: "var(--text-light)", cursor: "pointer", fontWeight: "normal" }}>Дахин тохируулах</span></h3>
            <form>
              <div className="filter-item">
                <label className="filter-item-label">Улс</label>
                <select className="filter-select-sm">
                  <option value="">Бүх улс</option>
                  <option value="cn">Хятад</option>
                  <option value="kr">Солонгос</option>
                  <option value="vn">Вьетнам</option>
                </select>
              </div>

              <div className="filter-item">
                <label className="filter-item-label">Салбар</label>
                <select className="filter-select-sm">
                  <option value="">Бүх салбар</option>
                  <option value="electronics">Электроник</option>
                  <option value="machinery">Тоног төхөөрөмж</option>
                  <option value="textile">Нэхмэл</option>
                </select>
              </div>

              <div className="filter-item">
                <label className="filter-item-label">MOQ (нэгж)</label>
                <div className="min-max-inputs">
                  <input type="number" className="filter-input-sm" placeholder="Мин" />
                  <span>-</span>
                  <input type="number" className="filter-input-sm" placeholder="Макс" />
                </div>
              </div>

              <div className="filter-item">
                <label className="filter-item-label">Үнийн хүрээ (USD)</label>
                <div className="min-max-inputs">
                  <input type="number" className="filter-input-sm" placeholder="Мин" />
                  <span>-</span>
                  <input type="number" className="filter-input-sm" placeholder="Макс" />
                </div>
              </div>

              <div className="filter-item">
                <label className="filter-item-label d-flex justify-content-between align-items-center">
                  Сертификат <i className="fa-solid fa-chevron-up text-muted"></i>
                </label>
                <ul className="checkbox-list">
                  <li><label><input type="checkbox" defaultChecked /> ISO 9001</label></li>
                  <li><label><input type="checkbox" /> CE</label></li>
                  <li><label><input type="checkbox" /> RoHS</label></li>
                  <li><label><input type="checkbox" /> FDA</label></li>
                  <li><label><input type="checkbox" /> BSCI</label></li>
                </ul>
              </div>

              <div className="toggle-switch-wrapper">
                <span className="toggle-switch-label">Баталгаажсан эсэх<br /><span className="text-muted" style={{ fontSize: "0.7rem", fontWeight: "normal" }}>Verified supplier</span></span>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="filter-item">
                <label className="filter-item-label d-flex justify-content-between align-items-center">
                  Үйлдвэрлэлийн төрөл <i className="fa-solid fa-chevron-up text-muted"></i>
                </label>
                <ul className="checkbox-list">
                  <li><label><input type="checkbox" defaultChecked /> Standard</label></li>
                  <li><label><input type="checkbox" /> Custom (Tailor-made)</label></li>
                  <li><label><input type="checkbox" /> Private Label</label></li>
                  <li><label><input type="checkbox" /> OEM</label></li>
                  <li><label><input type="checkbox" /> ODM</label></li>
                </ul>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-4">
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{total.toLocaleString("mn-MN")} үр дүн</span>
                <button type="button" className="btn-brand px-4 py-1">Шүүх</button>
              </div>
            </form>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="factories-main-content">

          {/* Featured Partner Card — uses the first verified row from members table. */}
          {featured ? (
            <div id="featured-factory-partner" className="featured-partner-card">
              <div className="featured-partner-img-wrap">
                <SafeImage
                  src={featured.photo ? mediaUrl(featured.photo) : ""}
                  alt={featured.company}
                  className="featured-partner-img"
                  loading="lazy"
                  fallback={
                    <div
                      className="featured-partner-img d-flex align-items-center justify-content-center text-primary"
                      style={{ fontSize: "3rem", background: "#eff6ff" }}
                    >
                      <i className={featuredIcon}></i>
                    </div>
                  }
                />
                {featured.featured ? (
                  <div className="verified-badge-overlay"><i className="fa-solid fa-circle-check text-primary"></i> Verified</div>
                ) : null}
              </div>
              <div className="featured-partner-info">
                <div className="d-flex justify-content-between align-items-start">
                  <h2 className="featured-partner-title">{featured.company}</h2>
                  <button className="btn btn-link text-muted p-0"><i className="fa-regular fa-heart"></i></button>
                </div>
                {featured.industry ? (
                  <div className="featured-partner-meta">
                    <i className="fa-solid fa-tags me-1 text-muted"></i> {featured.industry}
                  </div>
                ) : null}
                {featured.blurb ? (
                  <div style={{ fontSize: "0.85rem", marginBottom: "1rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {featured.blurb}
                  </div>
                ) : null}
                <div className="featured-partner-stats">
                  <div className="featured-partner-stat-item">
                    <div className="label">Холбогдох хүн</div>
                    <div className="val">{featured.contactCount}</div>
                  </div>
                  {featured.email ? (
                    <div className="featured-partner-stat-item">
                      <div className="label">И-мэйл</div>
                      <div className="val text-truncate" style={{ maxWidth: 180 }}>{featured.email}</div>
                    </div>
                  ) : null}
                  {featured.phone ? (
                    <div className="featured-partner-stat-item">
                      <div className="label">Утас</div>
                      <div className="val">{featured.phone}</div>
                    </div>
                  ) : null}
                  {featured.website ? (
                    <div className="featured-partner-stat-item">
                      <div className="label">Вэб</div>
                      <div className="val text-truncate" style={{ maxWidth: 180 }}>{featured.website}</div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="featured-partner-actions">
                <Link href={compLogin} className="btn-brand-outline w-100 py-1 text-center" style={{ fontSize: "0.8rem" }}>Профайл харах</Link>
                <a href={featured.email ? `mailto:${featured.email}` : compMailto} className="btn-brand w-100 py-1 text-center" style={{ fontSize: "0.8rem" }}>Холбогдох</a>
              </div>
            </div>
          ) : null}

          {/* Results List — header */}
          <div className="results-header">
            <div className="results-title">
              <i className="fa-solid fa-list-check text-muted" style={{ fontSize: "0.95rem" }} />
              Үр дүнгийн жагсаалт
              {compKw !== "" ? <span className="text-muted fw-normal" style={{ fontSize: "0.85rem" }}> «{compKw}»</span> : null}
              <span className="results-count-pill">
                <i className="fa-solid fa-building" /> {total.toLocaleString("mn-MN")} компани
              </span>
            </div>
            <div className="results-sort-bar">
              <select className="sort-select" defaultValue="">
                <option value="">Эрэмбэлэх: Холбогдох байдал</option>
                <option value="featured">Verified эхэндээ</option>
                <option value="name">Нэрээр (А → Я)</option>
              </select>
              <div className="view-toggles" role="tablist" aria-label="View toggle">
                <button type="button" className="view-btn" aria-label="Жагсаалт"><i className="fa-solid fa-list"></i></button>
                <button type="button" className="view-btn active" aria-label="Сүлжээ"><i className="fa-solid fa-border-all"></i></button>
              </div>
            </div>
          </div>

          <div id="factory-results" className="results-list">
            {rows.length === 0 ? (
              <div
                className="result-list-item d-block text-center text-muted py-5"
                style={{ fontSize: "0.9rem" }}
              >
                <i className="fa-regular fa-folder-open d-block mb-2" style={{ fontSize: "1.5rem" }} />
                Тохирох үр дүн олдсонгүй.
                {compKw ? (
                  <>
                    {" "}
                    <Link href="/companies" className="text-primary text-decoration-none ms-1">
                      Бүх компанийг харах
                    </Link>
                  </>
                ) : null}
              </div>
            ) : (
              rows.map((c) => {
                const photo = c.photo ? mediaUrl(c.photo) : "";
                const blurb = c.blurb?.trim() || "Танилцуулга мэдээлэл оруулаагүй байна.";
                return (
                  <div
                    className={`result-list-item${c.featured ? " is-featured" : ""}`}
                    key={c.id}
                  >
                    <div className="result-item-icon" aria-hidden="true">
                      <SafeImage
                        src={photo}
                        alt={c.company}
                        loading="lazy"
                        fallback={<i className={companyIconForIndustry(c.industry)}></i>}
                      />
                    </div>

                    <div className="result-item-info">
                      <h3 className="result-item-title">
                        <Link href={compLogin} className="result-item-title-link">{c.company}</Link>
                        {c.featured ? (
                          <i className="fa-solid fa-circle-check text-primary" style={{ fontSize: "0.85rem" }} aria-label="Verified" />
                        ) : null}
                      </h3>
                      <div className="result-item-chip-row">
                        {c.industry ? (
                          <span className="result-item-chip is-industry">
                            <i className={companyIconForIndustry(c.industry)} /> {c.industry}
                          </span>
                        ) : null}
                        {c.website ? (
                          <span className="result-item-chip">
                            <i className="fa-solid fa-globe" />
                            <span className="text-truncate" style={{ maxWidth: 160 }}>{c.website.replace(/^https?:\/\//i, "")}</span>
                          </span>
                        ) : null}
                      </div>
                      <div className="result-item-loc">{blurb}</div>
                    </div>

                    <div className="result-item-stats">
                      <div className="result-item-stat">
                        <div className="result-item-stat-label">Холбогдох</div>
                        <div className="result-item-stat-value">
                          <i className="fa-regular fa-user" /> {c.contactCount}
                        </div>
                      </div>
                      <div className="result-item-stat">
                        <div className="result-item-stat-label">Утас</div>
                        <div className="result-item-stat-value">
                          {c.phone ? (
                            <>
                              <i className="fa-solid fa-phone" /> {c.phone}
                            </>
                          ) : (
                            <span className="text-muted fw-normal">—</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {c.featured ? (
                      <span className="result-item-badge">
                        <i className="fa-solid fa-circle-check" /> Verified
                      </span>
                    ) : (
                      <span className="result-item-badge is-muted">
                        <i className="fa-regular fa-circle" /> Member
                      </span>
                    )}

                    <div className="result-item-actions">
                      <Link href={compLogin} className="btn-brand-outline w-100 text-center" style={{ fontSize: "0.78rem" }}>
                        Профайл
                      </Link>
                      <a
                        href={c.email ? `mailto:${c.email}` : compMailto}
                        className="btn-brand w-100 text-center"
                        style={{ fontSize: "0.78rem" }}
                      >
                        Холбогдох
                      </a>
                    </div>

                    <button type="button" className="result-item-fav" aria-label="Хадгалах">
                      <i className="fa-regular fa-heart"></i>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination — placeholder until the backend supports paged member queries. */}
          {rows.length > 0 ? (
            <div className="custom-pagination">
              <span className="page-btn opacity-50" aria-disabled="true"><i className="fa-solid fa-chevron-left"></i></span>
              <Link href={compResultsHref} className="page-btn active">1</Link>
              <span className="page-btn opacity-50">…</span>
              <span className="page-btn opacity-50" aria-disabled="true"><i className="fa-solid fa-chevron-right"></i></span>
            </div>
          ) : null}

          {/* 4 Step Process */}
          <div className="process-steps-container">
            <h3 className="process-title">Match хийх 4 алхам</h3>
            <div className="process-flow">
              <div className="process-step">
                <div className="process-number">1</div>
                <div className="process-step-title">Хүсэлт</div>
                <div className="process-step-desc">Шаардлагаа илгээх</div>
                <i className="fa-solid fa-arrow-right process-arrow"></i>
              </div>
              <div className="process-step">
                <div className="process-number">2</div>
                <div className="process-step-title">Сонголт</div>
                <div className="process-step-desc">Тохирох түншүүд санал ирүүлэх</div>
                <i className="fa-solid fa-arrow-right process-arrow"></i>
              </div>
              <div className="process-step">
                <div className="process-number">3</div>
                <div className="process-step-title">Уулзалт</div>
                <div className="process-step-desc">Онлайн уулзалт, дээжийн үзэсгэлэн</div>
                <i className="fa-solid fa-arrow-right process-arrow"></i>
              </div>
              <div className="process-step">
                <div className="process-number">4</div>
                <div className="process-step-title">Гэрээ</div>
                <div className="process-step-desc">Гэрээ байгуулж, захиалга эхлэх</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar — sourcing form + shortlist remain static UI for now. */}
        <aside className="factories-sidebar-right">

          <div className="factory-widget">
            <h3 className="factory-widget-title" style={{ marginBottom: "0.5rem" }}>Хүсэлт илгээх</h3>
            <p className="text-muted mb-4" style={{ fontSize: "0.75rem", lineHeight: 1.4 }}>Бүтээгдэхүүний шаардлагаа илгээж, тохирох түншүүдээс санал аваарай.</p>

            <form className="sourcing-form">
              <label>Бүтээгдэхүүн</label>
              <input type="text" placeholder="Жишээ: Ухаалаг цагны оосор" />

              <label>Тоо хэмжээ (MOQ)</label>
              <input type="text" placeholder="Жишээ: 1,000 ширхэг" />

              <label>Техникийн шаардлага</label>
              <textarea placeholder="Материал, хэмжээ, өнгө, савлагаа, бусад шаардлагаа бичнэ үү..."></textarea>

              <label>Зориулалт зах зээл</label>
              <select>
                <option>Сонгоно уу</option>
                <option>Монгол улс</option>
                <option>Олон улс</option>
              </select>

              <label>Хавсралт (заавал биш)</label>
              <div className="file-upload-box">
                <i className="fa-solid fa-cloud-arrow-up"></i>
                <div className="file-upload-text">Файл чирэх эсвэл сонгох<br />(PDF, DOC, JPG, PNG)</div>
              </div>

              <button type="button" className="btn-brand w-100 py-2">Request Match</button>
              <div className="text-center mt-2 text-muted" style={{ fontSize: "0.7rem" }}>
                <i className="fa-solid fa-lock"></i> Мэдээлэл 100% нууцлагдана
              </div>
            </form>
          </div>

          {/* Shortlist — first 3 rows from the same dataset for a real preview. */}
          {rows.length > 0 ? (
            <div className="factory-widget">
              <h3 className="factory-widget-title">Жагсаалтад орсон ({Math.min(rows.length, 3)})</h3>
              <ul className="list-unstyled mb-0">
                {rows.slice(0, 3).map((c) => (
                  <li
                    key={c.id}
                    className="d-flex align-items-center gap-3 py-2"
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <div
                      className="d-flex align-items-center justify-content-center rounded text-primary"
                      style={{ width: 36, height: 36, background: "#eff6ff", flexShrink: 0 }}
                    >
                      <i className={companyIconForIndustry(c.industry)}></i>
                    </div>
                    <div className="flex-grow-1 text-truncate">
                      <div className="fw-bold" style={{ fontSize: "0.8rem" }}>{c.company}</div>
                      <div className="text-muted" style={{ fontSize: "0.7rem" }}>{c.industry ?? "—"}</div>
                    </div>
                    {c.featured ? <i className="fa-solid fa-circle-check text-primary"></i> : null}
                  </li>
                ))}
              </ul>
              <Link href={compResultsHref} className="btn-brand-outline w-100 py-1 mt-3 text-center text-decoration-none" style={{ fontSize: "0.8rem" }}>
                Бүгдийг харьцуулах
              </Link>
            </div>
          ) : null}

        </aside>

      </div>

      {/* Bottom Stats Bar — total comes from real DB count, the rest stay placeholder. */}
      <div className="container">
        <div className="bottom-stats-bar">
          <div className="b-stat-item">
            <i className="fa-solid fa-industry b-stat-icon"></i>
            <div className="b-stat-info">
              <div className="val">{total.toLocaleString("mn-MN")}</div>
              <div className="lbl">Үйлдвэрүүд</div>
            </div>
          </div>
          <div className="b-stat-item">
            <i className="fa-regular fa-user b-stat-icon"></i>
            <div className="b-stat-info">
              <div className="val">{rows.reduce((acc, c) => acc + c.contactCount, 0).toLocaleString("mn-MN")}</div>
              <div className="lbl">Холбогдох хүн</div>
            </div>
          </div>
          <div className="b-stat-item">
            <i className="fa-solid fa-globe b-stat-icon"></i>
            <div className="b-stat-info">
              <div className="val">{rows.filter((c) => c.featured).length.toLocaleString("mn-MN")}</div>
              <div className="lbl">Verified түнш</div>
            </div>
          </div>
          <div className="b-stat-item">
            <i className="fa-solid fa-bolt b-stat-icon text-warning"></i>
            <div className="b-stat-info">
              <div className="val">98%</div>
              <div className="lbl">Дундаж хариу өгөх хувь</div>
            </div>
          </div>
          <div className="b-stat-item">
            <i className="fa-regular fa-clock b-stat-icon text-primary"></i>
            <div className="b-stat-info">
              <div className="val">24ц</div>
              <div className="lbl">Дотор санал авах</div>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}
