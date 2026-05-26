import Link from "next/link";

import SafeImage from "@/components/SafeImage";
import { getLangFromCookies } from "@/lib/i18n/server";
import {
  formatMntCompact,
  loadInvestmentsData,
  projectIconForSector,
} from "@/lib/investments-data";

import PitchDeckEditor from "./PitchDeckEditor";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function InvestmentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const tab = (sp.tab ?? "").trim();

  const lang = await getLangFromCookies();
  const { projects, investors, featuredProject, facets } = await loadInvestmentsData(lang);
  const featuredIcon = projectIconForSector(featuredProject?.sector ?? null);

  return (
    <main className="page-content" style={{ backgroundColor: "var(--bg-page)" }}>

      <div className="container pt-4">
        <div className="mb-4">
          <h1 className="fw-bold" style={{ fontSize: "2rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>Хөрөнгө оруулалт</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>Төслөө танилцуулж хөрөнгө оруулагчтай холбогдох нэгдсэн орчин</p>
        </div>

        <div className="invest-top-tabs">
          <Link href="/investments" className={`invest-tab ${!tab ? "active" : ""}`}>
            <i className="fa-solid fa-magnifying-glass"></i> Төсөл хайх
          </Link>
          <Link href="/investments?tab=investors" className={`invest-tab ${tab === "investors" ? "active" : ""}`}>
            <i className="fa-solid fa-users"></i> Хөрөнгө оруулагчид
          </Link>
          <Link href="/investments?tab=pitchdeck" className={`invest-tab ${tab === "pitchdeck" ? "active" : ""}`}>
            <i className="fa-regular fa-file-powerpoint"></i> Pitch Deck
          </Link>
          <Link href="/investments?tab=dealroom" className={`invest-tab ${tab === "dealroom" ? "active" : ""}`}>
            <i className="fa-solid fa-display"></i> Deal Room
          </Link>
        </div>
      </div>

      {tab === "investors" ? (
        <div className="container inv-grid">
          {/* Sidebar Left: Filters — UI-only for now; not yet wired to a backend. */}
          <aside className="inv-sidebar-left">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="h6 fw-bold mb-0">Шүүлтүүр</h3>
              <Link href="/investments?tab=investors" className="text-primary small text-decoration-none">Цэвэрлэх</Link>
            </div>

            <div className="inv-filter-section">
              <div className="inv-filter-title">Хөрөнгө оруулалтын төрөл <i className="fa-solid fa-circle-info"></i></div>
              <div className="d-flex flex-column gap-2">
                <label className="small d-flex align-items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked /> Бүх төрөл</label>
                <label className="small d-flex align-items-center gap-2 cursor-pointer"><input type="checkbox" /> VC (Venture Capital)</label>
                <label className="small d-flex align-items-center gap-2 cursor-pointer"><input type="checkbox" /> Angel Investor</label>
                <label className="small d-flex align-items-center gap-2 cursor-pointer"><input type="checkbox" /> Strategic Investor</label>
                <label className="small d-flex align-items-center gap-2 cursor-pointer"><input type="checkbox" /> Family Office</label>
              </div>
            </div>

            <div className="inv-filter-section">
              <div className="inv-filter-title">Тасалбарын хэмжээ <i className="fa-solid fa-chevron-down"></i></div>
              <select className="form-select form-select-sm border-light bg-light mb-3" defaultValue="Бүх хэмжээ">
                <option>Бүх хэмжээ</option>
              </select>
              <div className="d-flex flex-column gap-2">
                <label className="small d-flex align-items-center gap-2 cursor-pointer"><input type="radio" name="ticket" /> $0 - $250 мянга</label>
                <label className="small d-flex align-items-center gap-2 cursor-pointer"><input type="radio" name="ticket" /> $250 мянга - $1 сая</label>
                <label className="small d-flex align-items-center gap-2 cursor-pointer"><input type="radio" name="ticket" defaultChecked /> $1 сая - $5 сая</label>
                <label className="small d-flex align-items-center gap-2 cursor-pointer"><input type="radio" name="ticket" /> $5 сая+</label>
              </div>
            </div>

            <div className="inv-filter-section">
              <div className="inv-filter-title">Салбар <i className="fa-solid fa-chevron-down"></i></div>
              {facets.investorIndustries.length === 0 ? (
                <div className="text-muted small">Хөрөнгө оруулагч бүртгэгдээгүй байна.</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {facets.investorIndustries.map((f) => (
                    <label key={f.value} className="small d-flex align-items-center gap-2 cursor-pointer">
                      <input type="checkbox" />
                      <span className="flex-grow-1">{f.value}</span>
                      <span className="text-muted">{f.count}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="inv-filter-section">
              <div className="inv-filter-title">Албан тушаал <i className="fa-solid fa-chevron-down"></i></div>
              {facets.investorPositions.length === 0 ? (
                <div className="text-muted small">Албан тушаал бүртгэгдээгүй байна.</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {facets.investorPositions.slice(0, 8).map((f) => (
                    <label key={f.value} className="small d-flex align-items-center gap-2 cursor-pointer">
                      <input type="checkbox" />
                      <span className="flex-grow-1 text-truncate" title={f.value}>{f.value}</span>
                      <span className="text-muted">{f.count}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="inv-filter-section border-0 pb-0">
              <div className="inv-filter-title">Үе шат <i className="fa-solid fa-circle-info"></i></div>
              <div className="d-flex flex-column gap-2">
                <label className="small d-flex align-items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked /> Pre-Seed / Seed</label>
                <label className="small d-flex align-items-center gap-2 cursor-pointer"><input type="checkbox" /> Series A</label>
                <label className="small d-flex align-items-center gap-2 cursor-pointer"><input type="checkbox" /> Series B</label>
                <label className="small d-flex align-items-center gap-2 cursor-pointer"><input type="checkbox" /> Series C+</label>
              </div>
            </div>

            <a href="#" className="btn btn-sm btn-link text-muted w-100 mt-3 text-decoration-none" style={{ fontSize: "0.7rem" }}>Бүх шүүлтүүрийг харуулах <i className="fa-solid fa-chevron-down ms-1"></i></a>
          </aside>

          {/* Main Content Area — investor grid backed by `featuredMembers` rows. */}
          <div className="inv-main">
            <div className="d-flex gap-3 mb-4">
              <div className="inv-search-bar flex-grow-1 mb-0">
                <i className="fa-solid fa-magnifying-glass text-muted"></i>
                <input type="text" className="inv-search-input" placeholder="Хөрөнгө оруулагч хайх..." />
              </div>
              <button className="dlr-action-btn h-100"><i className="fa-regular fa-bookmark"></i> Хадгалсан</button>
            </div>

            {investors.length === 0 ? (
              <div className="inv-featured-card text-center py-5">
                <div className="text-muted mb-2"><i className="fa-solid fa-user-slash fs-2"></i></div>
                <p className="mb-0 small text-muted">Одоогоор онцлох хөрөнгө оруулагч бүртгэгдээгүй байна.</p>
              </div>
            ) : (
              <>
                {/* Featured Investor — first row from featured members. */}
                {(() => {
                  const top = investors[0];
                  return (
                    <div className="inv-featured-card">
                      <div className="inv-featured-badge"><i className="fa-solid fa-bolt"></i> Top match</div>
                      <div className="inv-header-main">
                        <div className="inv-logo-big">
                          <SafeImage
                            src={top.photo || ""}
                            alt={top.name}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                            fallback={<i className="fa-solid fa-user-tie"></i>}
                          />
                        </div>
                        <div className="inv-title-wrap">
                          <div className="inv-name">
                            {top.name}
                            <i className="fa-solid fa-circle-check text-primary fs-6"></i>{" "}
                            <span className="badge bg-light text-primary border fw-normal" style={{ fontSize: "0.6rem" }}>Verified</span>
                          </div>
                          {top.company || top.industry ? (
                            <div className="inv-item-tags">
                              {top.company ? <span className="inv-item-tag">{top.company}</span> : null}
                              {top.industry ? <span className="inv-item-tag">{top.industry}</span> : null}
                            </div>
                          ) : null}
                        </div>
                        <button className="inv-save-btn"><i className="fa-regular fa-bookmark"></i></button>
                      </div>
                      {top.bio ? (
                        <p className="small text-muted mb-4" style={{ lineHeight: 1.5 }}>{top.bio}</p>
                      ) : null}
                      <div className="d-flex gap-3">
                        <Link href="/auth/login" className="dlr-action-btn px-4 text-decoration-none">Профайл үзэх</Link>
                        <a href="mailto:info@busy.mn" className="dlr-action-btn dlr-action-btn-primary px-4 text-decoration-none">Хүсэлт илгээх</a>
                      </div>
                    </div>
                  );
                })()}

                {/* Grid Results */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="small fw-bold text-dark">
                    Нийт {investors.length.toLocaleString("mn-MN")} хөрөнгө оруулагч <i className="fa-solid fa-circle-info text-muted ms-1"></i>
                  </div>
                  <div className="d-flex gap-2">
                    <select className="form-select form-select-sm border-0 bg-light py-1 px-3" style={{ width: "auto", fontSize: "0.75rem" }} defaultValue="Тааруулалтаар (Өндөрөөс бага)">
                      <option>Тааруулалтаар (Өндөрөөс бага)</option>
                    </select>
                    <div className="btn-group">
                      <button className="btn btn-sm btn-light border active"><i className="fa-solid fa-table-cells-large"></i></button>
                      <button className="btn btn-sm btn-light border"><i className="fa-solid fa-list"></i></button>
                    </div>
                  </div>
                </div>

                <div className="inv-card-grid">
                  {investors.slice(1).map((m, idx) => {
                    const initial = (m.name || "?").trim().charAt(0).toUpperCase() || "?";
                    return (
                      <div className="inv-item-card" key={m.id}>
                        {idx === 0 ? (
                          <div className="inv-featured-badge py-1" style={{ top: 8, right: 8, left: "auto" }}>
                            <i className="fa-solid fa-bolt"></i> Top match
                          </div>
                        ) : null}
                        <div className="inv-item-header">
                          <div className="inv-logo-sm" style={{ background: "#1e293b" }}>{initial}</div>
                          <div className="inv-title-wrap">
                            <div className="inv-item-title">
                              {m.name} <i className="fa-solid fa-circle-check text-primary small"></i>
                            </div>
                            <div className="inv-item-type">{m.position ?? "Member"} <i className="fa-solid fa-circle-info"></i></div>
                          </div>
                        </div>
                        <div className="inv-item-tags">
                          {m.company ? <span className="inv-item-tag">{m.company}</span> : null}
                          {m.industry ? <span className="inv-item-tag">{m.industry}</span> : null}
                        </div>
                        {m.bio ? (
                          <p className="small text-muted mt-2 mb-3" style={{ lineHeight: 1.4 }}>
                            {m.bio.length > 140 ? `${m.bio.slice(0, 140)}…` : m.bio}
                          </p>
                        ) : null}
                        <div className="inv-match-bar">
                          <div className="inv-match-val"><i className="fa-regular fa-circle-check"></i> Verified</div>
                          <div className="d-flex gap-2">
                            <button className="inv-save-btn"><i className="fa-regular fa-bookmark"></i></button>
                            <a
                              href="mailto:info@busy.mn"
                              className="btn btn-sm btn-outline-primary fw-bold px-3 text-decoration-none"
                              style={{ borderRadius: 8, fontSize: "0.7rem" }}
                            >
                              Холбогдох
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Sidebar Right — readiness checklist remains UI-only. */}
          <aside className="inv-sidebar-right">
            <div className="inv-sidebar-left mb-4">
              <div className="dlr-card-title text-uppercase mb-4" style={{ fontSize: "0.75rem" }}>Таны бэлэн байдал</div>

              <div className="dlr-status-circle">
                <svg viewBox="0 0 36 36" className="dlr-status-svg">
                  <path className="dlr-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style={{ fill: "none", stroke: "#f1f5f9", strokeWidth: 3 }} />
                  <path className="dlr-circle-fill" strokeDasharray="80, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style={{ fill: "none", stroke: "#2563eb", strokeWidth: 3, strokeLinecap: "round" }} />
                </svg>
                <div className="dlr-status-percent">
                  <span className="dlr-status-val">80%</span>
                  <span className="dlr-status-lbl">Бэлэн</span>
                </div>
              </div>

              <p className="small text-muted text-center mb-4">Хөрөнгө оруулагчтай холбогдохын өмнө дараах мэдээллүүдээ бүрэн болгоорой.</p>

              <div className="dlr-checklist mb-4">
                <div className="dlr-checklist-item border-0 py-2">
                  <div className="small text-muted d-flex align-items-center gap-2"><i className="fa-regular fa-file-powerpoint fs-6"></i> <span>Pitch Deck</span></div>
                  <i className="fa-solid fa-circle-check text-success"></i>
                </div>
                <div className="dlr-checklist-item border-0 py-2">
                  <div className="small text-muted d-flex align-items-center gap-2"><i className="fa-solid fa-chart-line fs-6"></i> <span>Санхүүгийн мэдээлэл</span></div>
                  <i className="fa-solid fa-circle-check text-success"></i>
                </div>
                <div className="dlr-checklist-item border-0 py-2">
                  <div className="small text-muted d-flex align-items-center gap-2"><i className="fa-solid fa-users fs-6"></i> <span>Багийн танилцуулга</span></div>
                  <i className="fa-solid fa-circle-check text-success"></i>
                </div>
                <div className="dlr-checklist-item border-0 py-2">
                  <div className="small text-muted d-flex align-items-center gap-2"><i className="fa-solid fa-magnifying-glass fs-6"></i> <span>Зах зээлийн судалгаа</span></div>
                  <i className="fa-solid fa-circle-check text-success"></i>
                </div>
              </div>

              <button className="btn btn-primary w-100 mb-2 py-2 fw-bold" style={{ borderRadius: 12, fontSize: "0.85rem" }}>Хөрөнгө оруулагчтай холбогдох</button>
              <button className="btn btn-light border w-100 py-2 fw-bold" style={{ borderRadius: 12, fontSize: "0.85rem" }}>Төслийн профайл</button>
            </div>

            <div className="inv-advice-card">
              <div className="inv-advice-icon"><i className="fa-solid fa-lightbulb"></i></div>
              <div className="small fw-bold text-dark mb-2">Зөвлөгөө</div>
              <p className="small text-muted mb-3" style={{ lineHeight: 1.4 }}>Хөрөнгө оруулагчид таны профайлыг үзэх магадлалыг нэмэгдүүлэхийн тулд мэдээллээ бүрэн байхыг анхаарна уу.</p>
              <a href="#" className="text-primary small fw-bold text-decoration-none">Дэлгэрэнгүй үзэх <i className="fa-solid fa-arrow-right ms-1"></i></a>
            </div>
          </aside>
        </div>
      ) : tab === "pitchdeck" ? (
        <PitchDeckEditor />
      ) : tab === "dealroom" ? (
        <DealRoomTab />
      ) : (
        <div className="container investments-layout">
          {/* Left Sidebar: Filter — UI-only for now. */}
          <aside className="invest-sidebar-left">
            <div className="invest-widget">
              <h3 className="invest-widget-title">Шүүлтүүр <span style={{ fontSize: "0.75rem", color: "var(--text-light)", cursor: "pointer", fontWeight: "normal" }}>Цэвэрлэх</span></h3>
              <form>
                <div className="filter-section">
                  <label className="filter-label">Салбар</label>
                  <select className="filter-select" defaultValue="">
                    <option value="">Бүгд</option>
                    {facets.projectSectors.map((f) => (
                      <option key={f.value} value={f.value}>{f.value}</option>
                    ))}
                  </select>
                  {facets.projectSectors.length === 0 ? (
                    <div className="text-muted small mt-2">
                      Бүртгэлтэй төсөл байхгүй тул салбарын мэдээлэл алга.
                    </div>
                  ) : (
                    <ul className="filter-checkbox-list">
                      {facets.projectSectors.map((f) => (
                        <li key={f.value}>
                          <label className="d-flex align-items-center gap-2">
                            <input type="checkbox" />
                            <i className={`${projectIconForSector(f.value)} text-muted`} style={{ fontSize: "0.75rem" }}></i>
                            <span className="flex-grow-1">{f.value}</span>
                            <span className="text-muted small">{f.count}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="filter-section">
                  <label className="filter-label">Хөрөнгө оруулалтын хэмжээ</label>
                  <select className="filter-select" defaultValue="Бүгд">
                    <option>Бүгд</option>
                  </select>
                  <ul className="filter-checkbox-list">
                    <li><label><input type="checkbox" /> Доор ₮500 сая</label></li>
                    <li><label><input type="checkbox" /> ₮500 сая - ₮2 тэрбум</label></li>
                    <li><label><input type="checkbox" /> ₮2 - ₮10 тэрбум</label></li>
                    <li><label><input type="checkbox" /> ₮10 тэрбумаас дээш</label></li>
                  </ul>
                </div>

                <div className="filter-section">
                  <label className="filter-label">Үе шат (Stage)</label>
                  <select className="filter-select" defaultValue="Бүгд">
                    <option>Бүгд</option>
                  </select>
                  <ul className="filter-checkbox-list">
                    <li><label><input type="checkbox" /> Pre-Seed</label></li>
                    <li><label><input type="checkbox" defaultChecked /> Seed</label></li>
                    <li><label><input type="checkbox" /> Series A</label></li>
                    <li><label><input type="checkbox" /> Growth</label></li>
                  </ul>
                </div>

                <div className="filter-section">
                  <label className="filter-label">Байршил</label>
                  <select className="filter-select" defaultValue="Бүгд">
                    <option>Бүгд</option>
                  </select>
                  <ul className="filter-checkbox-list">
                    <li><label><input type="checkbox" /> Улаанбаатар</label></li>
                    <li><label><input type="checkbox" /> Орон нутаг</label></li>
                    <li><label><input type="checkbox" /> Гадаад</label></li>
                  </ul>
                </div>

                <div className="filter-section" style={{ borderBottom: "none" }}>
                  <label className="filter-label">Төлөв</label>
                  <select className="filter-select" defaultValue="Бүгд">
                    <option>Бүгд</option>
                  </select>
                  <ul className="filter-checkbox-list">
                    <li><label><input type="checkbox" defaultChecked /> Нээлттэй</label></li>
                    <li><label><input type="checkbox" /> Яриа хэлэлцээтэй</label></li>
                    <li><label><input type="checkbox" /> Хаагдсан</label></li>
                  </ul>
                </div>

                <button type="button" className="btn-brand-outline w-100 mt-3" style={{ borderColor: "var(--border-color)", color: "var(--text-main)" }}>Шүүлтүүр хэрэглэх</button>
              </form>
            </div>
          </aside>

          {/* Main Content Area — projects from investment_projects API. */}
          <div className="invest-main-content">
            {featuredProject ? (
              <div className="featured-project-card">
                <div className="featured-img-wrap position-relative">
                  <span className="badge bg-secondary position-absolute" style={{ top: 10, left: 10, fontWeight: 600, opacity: 0.8 }}>Онцлох төсөл</span>
                  <SafeImage
                    src={featuredProject.coverImageUrl || ""}
                    alt={featuredProject.title}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    fallback={<i className={featuredIcon}></i>}
                  />
                </div>
                <div className="featured-content">
                  <div className="featured-header">
                    <div>
                      <h2 className="featured-title">
                        {featuredProject.title} <i className="fa-solid fa-circle-check text-primary" style={{ fontSize: "1rem" }}></i>
                      </h2>
                      <div className="featured-tags">
                        <span>{featuredProject.sector ?? "Verified"}</span>{" "}
                        <span className="featured-tag primary">{featuredProject.statusLabel ?? "Active"}</span>
                      </div>
                    </div>
                    <button className="btn btn-link text-muted p-0"><i className="fa-regular fa-heart"></i></button>
                  </div>

                  <div className="featured-funding">
                    <div>
                      <div className="funding-target">{formatMntCompact(featuredProject.targetMnt)}</div>
                      <div className="funding-label">Хөрөнгө оруулалтын зорилго</div>
                    </div>
                    <div className="text-end">
                      <div className="funding-percent">{featuredProject.raisedPercent}%</div>
                      <div className="funding-label">Босгосон дүн</div>
                    </div>
                  </div>

                  <div className="funding-progress-bar">
                    <div className="funding-progress-fill" style={{ width: `${featuredProject.raisedPercent}%` }}></div>
                  </div>

                  {featuredProject.startDate ? (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                      <i className="fa-solid fa-calendar me-1"></i>{" "}
                      {new Date(featuredProject.startDate).toLocaleDateString("mn-MN")}
                    </div>
                  ) : null}

                  {featuredProject.excerpt ? (
                    <div className="featured-desc">{featuredProject.excerpt}</div>
                  ) : null}

                  <div className="featured-actions mt-3">
                    <a
                      href={`mailto:info@busy.mn?subject=${encodeURIComponent(featuredProject.title)}`}
                      className="btn-brand-outline px-4 py-1 text-decoration-none"
                    >
                      Төсөл үзэх
                    </a>
                    <a href="mailto:info@busy.mn" className="btn-brand px-4 py-1 text-decoration-none">
                      Уулзалт товлох
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="featured-project-card">
                <div className="featured-content text-center py-5">
                  <i className="fa-solid fa-folder-open text-muted fs-1 mb-3"></i>
                  <h3 className="h6 fw-bold">Одоогоор онцлох төсөл алга</h3>
                  <p className="small text-muted mb-3">
                    Энд зөвхөн хөрөнгө оруулалтын төсөл харагдана. Аяллын хуудас (/trips) болон өөр.
                  </p>
                  <Link href="/auth/login?next=/platform" className="btn-brand-outline btn-sm text-decoration-none">
                    Төсөл нийтлэх
                  </Link>
                </div>
              </div>
            )}

            <div className="projects-header">
              <div className="projects-title">
                Төслүүд{" "}
                <span className="projects-count">
                  {projects.length === 0 ? "0 төсөл" : `1-${projects.length} / ${projects.length} төсөл`}
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <select className="filter-select m-0" style={{ width: "auto", paddingRight: "2rem" }} defaultValue="Шинэ эхлээд">
                  <option>Шинэ эхлээд</option>
                </select>
                <div className="view-toggles">
                  <div className="view-btn active"><i className="fa-solid fa-border-all"></i></div>
                  <div className="view-btn"><i className="fa-solid fa-list"></i></div>
                </div>
              </div>
            </div>

            <div className="projects-grid">
              {projects.length === 0 ? (
                <div className="inv-featured-card text-center py-5 w-100">
                  <i className="fa-solid fa-folder-open text-muted fs-1 mb-3"></i>
                  <h3 className="h6 fw-bold">Бүртгэлтэй хөрөнгө оруулалтын төсөл алга</h3>
                  <p className="small text-muted mb-3">
                    BNI Korea зэрэг аяллын мэдээлэл энд харагдахгүй. Төсөл нийтлэхийн тулд нэвтэрнэ үү.
                  </p>
                  <Link href="/auth/login?next=/platform" className="btn-brand px-4 py-1 text-decoration-none">
                    Төсөл нийтлэх
                  </Link>
                </div>
              ) : (
                projects.map((p) => (
                  <a
                    key={p.id}
                    href={`mailto:info@busy.mn?subject=${encodeURIComponent(p.title)}`}
                    className="project-card text-decoration-none text-dark"
                  >
                    <div className="p-card-header">
                      <div className="p-card-img-placeholder">
                        <SafeImage
                          src={p.coverImageUrl || ""}
                          alt={p.title}
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          fallback={<i className={projectIconForSector(p.sector)}></i>}
                        />
                      </div>
                      <div className="p-card-tags">
                        <span className="p-card-tag">{p.statusLabel ?? "Active"}</span>
                        <span className="p-card-tag" style={{ background: "#fff", border: "1px solid var(--border-color)" }}>
                          <i className="fa-solid fa-check text-primary"></i> Verified
                        </span>
                      </div>
                    </div>
                    <div className="p-card-title">{p.title}</div>
                    <div className="p-card-sector">{p.sector ?? "Investment opportunity"}</div>
                    <div className="p-card-funding-row">
                      <div>
                        <div className="p-card-target">{formatMntCompact(p.targetMnt)}</div>
                      </div>
                      <div className="p-card-percent">{p.raisedPercent}% босгосон</div>
                    </div>
                    <div className="funding-progress-bar"><div className="funding-progress-fill" style={{ width: `${p.raisedPercent}%` }}></div></div>
                    {p.excerpt ? (
                      <div className="p-card-label mb-2">{p.excerpt.length > 120 ? `${p.excerpt.slice(0, 120)}…` : p.excerpt}</div>
                    ) : null}
                    {p.startDate ? (
                      <div className="p-card-loc">
                        <i className="fa-solid fa-calendar me-1"></i>{" "}
                        {new Date(p.startDate).toLocaleDateString("mn-MN")}
                      </div>
                    ) : null}
                  </a>
                ))
              )}
            </div>

            <h3 className="section-title">Pitch Deck Preview <i className="fa-regular fa-circle-question text-muted" style={{ fontSize: "0.9rem" }}></i></h3>
            <div className="deck-gallery">
              <div className="deck-slide">
                <div className="deck-img"><i className="fa-solid fa-image"></i></div>
                <div className="deck-label">1 &nbsp;&nbsp; Cover</div>
              </div>
              <div className="deck-slide">
                <div className="deck-img"><i className="fa-solid fa-chart-pie"></i></div>
                <div className="deck-label">2 &nbsp;&nbsp; Problem</div>
              </div>
              <div className="deck-slide">
                <div className="deck-img"><i className="fa-solid fa-lightbulb"></i></div>
                <div className="deck-label">3 &nbsp;&nbsp; Solution</div>
              </div>
              <div className="deck-slide">
                <div className="deck-img"><i className="fa-solid fa-chart-column"></i></div>
                <div className="deck-label">4 &nbsp;&nbsp; Market Size</div>
              </div>
              <div className="deck-slide">
                <div className="deck-img"><i className="fa-solid fa-sitemap"></i></div>
                <div className="deck-label">5 &nbsp;&nbsp; Business Model</div>
              </div>
              <div className="deck-slide">
                <div className="deck-img"><i className="fa-solid fa-arrow-trend-up"></i></div>
                <div className="deck-label">6 &nbsp;&nbsp; Traction</div>
              </div>
            </div>

            <h3 className="section-title mt-4">Deal Room Preview <i className="fa-regular fa-circle-question text-muted" style={{ fontSize: "0.9rem" }}></i></h3>
            <div className="deal-room-grid">
              <div className="deal-box">
                <div className="deal-box-title"><i className="fa-solid fa-shield-halved"></i> NDA</div>
                <div className="deal-box-content mb-3">NDA илгээх, гарын үсэг зуруулах</div>
                <button className="btn-brand-outline w-100 py-1" style={{ fontSize: "0.75rem", borderColor: "var(--border-color)", color: "var(--text-main)" }}>Илгээх</button>
              </div>
              <div className="deal-box">
                <div className="deal-box-title"><i className="fa-regular fa-folder-open"></i> Баримт бичиг</div>
                <div className="deal-box-content">
                  <ul className="deal-list">
                    <li><i className="fa-solid fa-file-pdf text-danger"></i> Pitch Deck_v2.pdf</li>
                    <li><i className="fa-solid fa-file-excel text-success"></i> Financial Model.xlsx</li>
                  </ul>
                  <a href="#" className="deal-link text-center w-100 mt-2">Бүгдийг харах</a>
                </div>
              </div>
              <div className="deal-box">
                <div className="deal-box-title"><i className="fa-solid fa-chart-line"></i> KPI & Метрик</div>
                <div className="deal-box-content">
                  <div className="d-flex justify-content-between mb-2">
                    <div><span className="fw-bold text-dark d-block">{formatMntCompact(featuredProject?.targetMnt ?? null)}</span> Зорилт</div>
                    <div><span className="fw-bold text-dark d-block">{projects.length}</span> Төсөл</div>
                  </div>
                  <a href="#" className="deal-link text-center w-100 mt-2">Дашбоардыг харах</a>
                </div>
              </div>
              <div className="deal-box">
                <div className="deal-box-title"><i className="fa-regular fa-square-check"></i> Due Diligence</div>
                <div className="deal-box-content">
                  <ul className="deal-list">
                    <li><i className="fa-solid fa-circle-check text-success"></i> Санхүүгийн дүн шинжилгээ</li>
                    <li><i className="fa-solid fa-circle-check text-success"></i> Хууль эрх зүйн шалгалт</li>
                  </ul>
                  <a href="#" className="deal-link text-center w-100 mt-2">Прогресс харах</a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar — readiness checklist remains UI-only. */}
          <aside className="invest-sidebar-right">
            <div className="invest-widget checklist-widget">
              <h3 className="invest-widget-title" style={{ marginBottom: "0.5rem" }}>Хөрөнгө оруулалт татахад бэлэн үү?</h3>
              <p className="checklist-desc">Доорх зүйлсийг бэлэн болгож, амжилтаа нэмэгдүүлээрэй.</p>

              <div className="checklist-items">
                <div className="checklist-item">
                  <div className="c-item-icon"><i className="fa-regular fa-file-powerpoint"></i></div>
                  <div className="c-item-text">
                    <div className="c-item-title">Pitch Deck</div>
                    <div className="c-item-subtitle">Байршуулагдсан</div>
                  </div>
                  <div className="c-item-status"><i className="fa-solid fa-circle-check"></i></div>
                </div>
                <div className="checklist-item">
                  <div className="c-item-icon"><i className="fa-solid fa-money-bill-trend-up"></i></div>
                  <div className="c-item-text">
                    <div className="c-item-title">Санхүүгийн мэдээлэл</div>
                    <div className="c-item-subtitle">Бүрэн</div>
                  </div>
                  <div className="c-item-status"><i className="fa-solid fa-circle-check"></i></div>
                </div>
              </div>

              <div className="readiness-bar-wrap">
                <div className="readiness-header">
                  <span>Бэлэн байдлын явц</span>
                  <span className="text-dark">75%</span>
                </div>
                <div className="r-bar">
                  <div className="r-fill" style={{ width: "75%" }}></div>
                </div>
              </div>

              <button className="btn-brand w-100 py-2 mb-2">Төсөл нийтлэх</button>
              <button className="btn-brand-outline w-100 py-2" style={{ borderColor: "var(--border-color)", color: "var(--text-main)" }}>Төслийн профайл</button>
            </div>
          </aside>
        </div>
      )}

    </main>
  );
}

/** Deal Room tab — interactive UI shell, intentionally not DB-backed yet.
 *  Extracted from the main component so the JSX above stays manageable and so
 *  the file's data-rendering paths can be reasoned about independently. */
function DealRoomTab() {
  return (
    <div className="container dlr-layout">
      <aside className="dlr-sidebar-left">
        <div className="dlr-filter-group">
          <div className="dlr-filter-title">
            Шүүлтүүр
            <Link href="/investments?tab=dealroom" className="text-primary fw-normal" style={{ fontSize: "0.7rem", textDecoration: "none" }}>Цэвэрлэх</Link>
          </div>

          <div className="mb-4">
            <div className="small fw-bold text-muted text-uppercase mb-3" style={{ fontSize: "0.65rem" }}>Хавтаснууд</div>
            <ul className="dlr-nav-list">
              <li><a href="#" className="dlr-nav-item active"><span>Бүх баримт бичиг</span> <span className="dlr-nav-count">48</span></a></li>
              <li><a href="#" className="dlr-nav-item"><span>Компанийн баримт</span> <span className="dlr-nav-count">7</span></a></li>
              <li><a href="#" className="dlr-nav-item"><span>Санхүү</span> <span className="dlr-nav-count">10</span></a></li>
              <li><a href="#" className="dlr-nav-item"><span>Хуулийн баримт</span> <span className="dlr-nav-count">8</span></a></li>
              <li><a href="#" className="dlr-nav-item"><span>Зах зээлийн судалгаа</span> <span className="dlr-nav-count">6</span></a></li>
              <li><a href="#" className="dlr-nav-item"><span>Бүтээгдэхүүний материал</span> <span className="dlr-nav-count">7</span></a></li>
              <li><a href="#" className="dlr-nav-item"><span>Баг ба засаглал</span> <span className="dlr-nav-count">5</span></a></li>
            </ul>
          </div>

          <div className="mb-4">
            <div className="small fw-bold text-muted text-uppercase mb-3" style={{ fontSize: "0.65rem" }}>Файлын төрөл</div>
            <div className="d-flex flex-column gap-2">
              <label className="dlr-nav-item py-1 px-2 border-0 cursor-pointer">
                <span className="d-flex align-items-center gap-2"><input type="checkbox" defaultChecked /> PDF</span>
                <span className="dlr-nav-count">24</span>
              </label>
              <label className="dlr-nav-item py-1 px-2 border-0 cursor-pointer">
                <span className="d-flex align-items-center gap-2"><input type="checkbox" /> Excel</span>
                <span className="dlr-nav-count">9</span>
              </label>
              <label className="dlr-nav-item py-1 px-2 border-0 cursor-pointer">
                <span className="d-flex align-items-center gap-2"><input type="checkbox" /> PPT</span>
                <span className="dlr-nav-count">6</span>
              </label>
              <label className="dlr-nav-item py-1 px-2 border-0 cursor-pointer">
                <span className="d-flex align-items-center gap-2"><input type="checkbox" /> Word</span>
                <span className="dlr-nav-count">4</span>
              </label>
            </div>
          </div>
        </div>
      </aside>

      <div className="dlr-main">
        <div className="dlr-card">
          <div className="dlr-project-header">
            <div className="dlr-project-logo">
              <i className="fa-solid fa-leaf"></i>
              <div className="dlr-verify"><i className="fa-solid fa-check"></i></div>
            </div>
            <div className="dlr-project-info">
              <div className="dlr-project-title">EcoRide Deal Room <span className="badge bg-light text-primary border px-2 py-1" style={{ fontSize: "0.6rem" }}>Verified</span></div>
              <div className="dlr-project-meta">E-mobility • CleanTech <span className="text-success fw-bold"><i className="fa-solid fa-shield-halved"></i> Аюулгүй орчин</span></div>
              <div className="dlr-project-tags">
                <span className="dlr-tag">Technology</span>
                <span className="dlr-tag">Green Energy</span>
                <span className="dlr-tag dlr-tag-safe">NDA Required</span>
              </div>
              <p className="small text-muted mb-0">Сэргээгдэх эрчим хүчээр ажилладаг цахилгаан скутер, хүргэлтийн шийдлээр хотын тээврийн шинэ стандарт бүтээнэ.</p>
            </div>
          </div>

          <div className="dlr-stats-row">
            <div className="dlr-stat-item">
              <i className="fa-solid fa-users dlr-stat-icon"></i>
              <div className="dlr-stat-info">
                <div className="dlr-stat-lbl">Хуваалцсан хөрөнгө оруулагч</div>
                <div className="dlr-stat-val">12</div>
              </div>
            </div>
            <div className="dlr-stat-item">
              <i className="fa-solid fa-clock dlr-stat-icon"></i>
              <div className="dlr-stat-info">
                <div className="dlr-stat-lbl">Сүүлийн идэвх</div>
                <div className="dlr-stat-val">Өнөөдөр 10:24</div>
              </div>
            </div>
            <div className="dlr-stat-item">
              <i className="fa-solid fa-calendar dlr-stat-icon"></i>
              <div className="dlr-stat-info">
                <div className="dlr-stat-lbl">Deal Room үүсгэсэн</div>
                <div className="dlr-stat-val">2024.04.12</div>
              </div>
            </div>
            <div className="dlr-stat-item">
              <i className="fa-solid fa-file-lines dlr-stat-icon"></i>
              <div className="dlr-stat-info">
                <div className="dlr-stat-lbl">Нийт файл</div>
                <div className="dlr-stat-val">48 файл</div>
              </div>
            </div>
          </div>

          <div className="d-flex gap-3 mt-4">
            <button className="dlr-action-btn dlr-action-btn-primary"><i className="fa-solid fa-plus"></i> Файл нэмэх</button>
            <button className="dlr-action-btn"><i className="fa-solid fa-users-gear"></i> Хандалт удирдах</button>
            <button className="dlr-action-btn"><i className="fa-solid fa-link"></i> Линк хуваалцах</button>
            <button className="dlr-action-btn ms-auto"><i className="fa-solid fa-ellipsis"></i></button>
          </div>
        </div>

        <div className="dlr-card">
          <div className="dlr-explorer-header">
            <div className="d-flex align-items-center gap-2">
              <h3 className="h6 fw-bold mb-0">Бүх баримт бичиг</h3>
              <span className="badge bg-light text-muted border">48</span>
            </div>
            <div className="d-flex gap-2">
              <div className="input-group input-group-sm" style={{ width: 200 }}>
                <span className="input-group-text bg-white border-end-0"><i className="fa-solid fa-magnifying-glass text-muted"></i></span>
                <input type="text" className="form-control border-start-0" placeholder="Хайх..." />
              </div>
              <div className="btn-group">
                <button className="btn btn-sm btn-light border active"><i className="fa-solid fa-table-cells-large"></i></button>
                <button className="btn btn-sm btn-light border"><i className="fa-solid fa-list"></i></button>
              </div>
            </div>
          </div>

          <table className="dlr-explorer-table">
            <thead>
              <tr>
                <th>Нэр</th>
                <th>Ангилал</th>
                <th>Хэмжээ</th>
                <th>Шинэчилсэн огноо</th>
                <th>Хандах эрх</th>
                <th>Төлөв</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><div className="d-flex align-items-center gap-3"><i className="fa-solid fa-folder text-primary fs-5"></i> Компанийн баримт</div></td>
                <td><span className="text-primary small fw-bold">Санхүү</span></td>
                <td>-</td>
                <td><span className="small text-muted">2024.05.28 14:32</span></td>
                <td><div className="d-flex align-items-center gap-1 text-muted small"><i className="fa-solid fa-users"></i> 12</div></td>
                <td><span className="dlr-status-badge dlr-status-done"><i className="fa-solid fa-circle-check"></i> Бүрэн</span></td>
              </tr>
              <tr>
                <td><div className="d-flex align-items-center gap-3"><i className="fa-solid fa-file-pdf dlr-file-icon dlr-file-pdf"></i> 2023 оны санхүүгийн тайлан.pdf</div></td>
                <td><span className="text-primary small fw-bold">Санхүү</span></td>
                <td>2.4 MB</td>
                <td><span className="small text-muted">2024.05.28 10:22</span></td>
                <td><div className="d-flex align-items-center gap-1 text-muted small"><i className="fa-solid fa-users"></i> 12</div></td>
                <td><span className="dlr-status-badge dlr-status-done"><i className="fa-solid fa-circle"></i> Идэвхтэй</span></td>
              </tr>
              <tr>
                <td><div className="d-flex align-items-center gap-3"><i className="fa-solid fa-file-excel dlr-file-icon dlr-file-excel"></i> Cap Table - 2024.05.xlsx</div></td>
                <td><span className="text-primary small fw-bold">Санхүү</span></td>
                <td>118 KB</td>
                <td><span className="small text-muted">2024.05.27 15:07</span></td>
                <td><div className="d-flex align-items-center gap-1 text-muted small"><i className="fa-solid fa-users"></i> 12</div></td>
                <td><span className="dlr-status-badge dlr-status-done"><i className="fa-solid fa-circle"></i> Идэвхтэй</span></td>
              </tr>
            </tbody>
          </table>
          <div className="text-center mt-3">
            <a href="#" className="text-primary small fw-bold text-decoration-none">Бүх файлыг харах <i className="fa-solid fa-arrow-right ms-1"></i></a>
          </div>
        </div>

        <div className="dlr-grid-2">
          <div className="dlr-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="h6 fw-bold mb-0">Нягт нямбай шалгах (Diligence) жагсаалт</h3>
              <span className="small text-muted">6 / 7</span>
            </div>
            <div className="dlr-checklist">
              <div className="dlr-checklist-item">
                <div className="dlr-checklist-lbl"><i className="fa-solid fa-circle-check text-success"></i> Санхүүгийн тайлан (3 жил)</div>
                <span className="dlr-status-badge dlr-status-done">Бүрэн</span>
              </div>
              <div className="dlr-checklist-item">
                <div className="dlr-checklist-lbl"><i className="fa-solid fa-circle-check text-success"></i> Cap table & Shareholders</div>
                <span className="dlr-status-badge dlr-status-done">Бүрэн</span>
              </div>
              <div className="dlr-checklist-item">
                <div className="dlr-checklist-lbl"><i className="fa-solid fa-circle-check text-success"></i> Pitch Deck</div>
                <span className="dlr-status-badge dlr-status-done">Бүрэн</span>
              </div>
              <div className="dlr-checklist-item">
                <div className="dlr-checklist-lbl"><i className="fa-solid fa-circle-check text-warning"></i> Харилцагчийн гэрээнүүд</div>
                <span className="dlr-status-badge dlr-status-pending">Дутуу</span>
              </div>
            </div>
            <div className="text-center mt-3">
              <a href="#" className="text-primary small fw-bold text-decoration-none">Жагсаалтыг харах <i className="fa-solid fa-arrow-right ms-1"></i></a>
            </div>
          </div>

          <div className="dlr-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="h6 fw-bold mb-0">Хөрөнгө оруулагчийн асуулт, хүсэлт</h3>
              <span className="badge bg-light text-muted border">3</span>
            </div>

            <div className="dlr-qa-item">
              <div className="dlr-qa-header">
                <div className="dlr-qa-author">
                  <div className="dlr-qa-avatar" style={{ background: "#e9d5ff", color: "#7e22ce" }}>SP</div>
                  Summit Capital
                </div>
                <div className="dlr-qa-status">Хариу хүлээгдэж байна</div>
              </div>
              <p className="dlr-qa-text mb-0">Сүүлийн 12 сарын борлуулалтын сарын тайлан илгээх боломжтой юу?</p>
              <div className="text-end small text-muted mt-1">2 цагийн өмнө</div>
            </div>

            <div className="dlr-qa-item">
              <div className="dlr-qa-header">
                <div className="dlr-qa-author">
                  <div className="dlr-qa-avatar" style={{ background: "#dcfce7", color: "#15803d" }}>NA</div>
                  Nordic Angels
                </div>
                <div className="dlr-qa-status text-success">Хариулсан</div>
              </div>
              <p className="dlr-qa-text mb-0">Мөнгөн урсгалын төлөвлөлтийн үндэслэлийг дэлгэрэнгүй тайлбарлаж өгнө үү?</p>
              <div className="text-end small text-muted mt-1">Өчигдөр 16:45</div>
            </div>

            <div className="text-center mt-3">
              <a href="#" className="text-primary small fw-bold text-decoration-none">Бүх асуулт, хүсэлтийг харах <i className="fa-solid fa-arrow-right ms-1"></i></a>
            </div>
          </div>
        </div>
      </div>

      <aside className="dlr-sidebar-right">
        <div className="dlr-card">
          <div className="dlr-card-title text-uppercase" style={{ fontSize: "0.75rem" }}>Deal Room төлөв</div>

          <div className="dlr-status-circle">
            <svg viewBox="0 0 36 36" className="dlr-status-svg">
              <path className="dlr-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style={{ fill: "none", stroke: "#f1f5f9", strokeWidth: 3 }} />
              <path className="dlr-circle-fill" strokeDasharray="78, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style={{ fill: "none", stroke: "#2563eb", strokeWidth: 3, strokeLinecap: "round" }} />
            </svg>
            <div className="dlr-status-percent">
              <span className="dlr-status-val">78%</span>
              <span className="dlr-status-lbl">Бэлэн байдал</span>
            </div>
          </div>

          <div className="small text-muted mb-4">Хөрөнгө оруулагчид хуваалцахад бэлэн байдлыг нэмэгдүүлнэ үү.</div>

          <div className="dlr-checklist mb-4">
            <div className="dlr-checklist-item border-0 py-2">
              <div className="small text-muted"><i className="fa-solid fa-folder-tree me-2"></i> Баримтын бүтэц</div>
              <i className="fa-solid fa-circle-check text-success"></i>
            </div>
            <div className="dlr-checklist-item border-0 py-2">
              <div className="small text-muted"><i className="fa-solid fa-user-lock me-2"></i> Эрхийн тохиргоо</div>
              <i className="fa-solid fa-circle-check text-success"></i>
            </div>
            <div className="dlr-checklist-item border-0 py-2">
              <div className="small text-muted"><i className="fa-solid fa-file-shield me-2"></i> Гол файлууд</div>
              <i className="fa-solid fa-circle-exclamation text-warning"></i>
            </div>
            <div className="dlr-checklist-item border-0 py-2">
              <div className="small text-muted"><i className="fa-solid fa-comments dlr-log-icon border-0 p-0 bg-transparent"></i> Q&A</div>
              <i className="fa-solid fa-circle-exclamation text-warning"></i>
            </div>
          </div>

          <button className="dlr-action-btn dlr-action-btn-primary w-100 mb-2">Хөрөнгө оруулагчтай хуваалцах</button>
          <button className="dlr-action-btn w-100">Deal Room тохиргоо</button>
        </div>

        <div className="dlr-card">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="dlr-card-title text-uppercase mb-0" style={{ fontSize: "0.75rem" }}>Үйл ажиллагааны лог</div>
            <select className="form-select form-select-sm border-0 bg-light py-0 px-2" style={{ fontSize: "0.65rem", width: "auto" }}>
              <option>Бүгд</option>
            </select>
          </div>

          <div className="dlr-log">
            <div className="dlr-log-item">
              <div className="dlr-log-icon"><i className="fa-solid fa-file-circle-plus"></i></div>
              <div className="dlr-log-content">
                <strong>Файл нэмсэн</strong>
                <div className="text-muted small">2023 оны санхүүгийн тайлан.pdf</div>
                <div className="dlr-log-meta">Та • Өнөөдөр 10:22</div>
              </div>
            </div>
            <div className="dlr-log-item">
              <div className="dlr-log-icon"><i className="fa-solid fa-eye"></i></div>
              <div className="dlr-log-content">
                <strong>Файл үзсэн</strong>
                <div className="text-muted small">EcoRide Pitch Deck.pdf</div>
                <div className="dlr-log-meta">Summit Capital • Өнөөдөр 09:41</div>
              </div>
            </div>
            <div className="dlr-log-item">
              <div className="dlr-log-icon"><i className="fa-solid fa-download"></i></div>
              <div className="dlr-log-content">
                <strong>Файл татсан</strong>
                <div className="text-muted small">Cap Table - 2024.05.xlsx</div>
                <div className="dlr-log-meta">Nordic Angels • Өчигдөр 16:45</div>
              </div>
            </div>
          </div>

          <div className="text-center mt-3">
            <a href="#" className="text-primary small fw-bold text-decoration-none">Бүх логийг харах <i className="fa-solid fa-arrow-right ms-1"></i></a>
          </div>
        </div>
      </aside>
    </div>
  );
}
