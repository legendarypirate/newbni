import Link from "next/link";
import { notFound } from "next/navigation";

import SafeImage from "@/components/SafeImage";
import { formatMnDate } from "@/lib/format-date";
import { internalApiUrl } from "@/lib/backend-api";
import { mediaUrl } from "@/lib/media-url";
import {
  loadNewsList,
  newsCategoryIcon,
  newsCategoryLabel,
  newsCategorySlug,
  type NewsArticleRow,
} from "@/lib/news-data";
import MemberFollowButton from "./MemberFollowButton";

export const dynamic = "force-dynamic";

type MemberTab = "jobs" | "about" | "news" | "shop" | "orders" | "cart";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
};

type PlatformProfilePublic = {
  accountId?: number;
  displayName?: string;
  bio?: string | null;
  photoUrl?: string | null;
  companyName?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  website?: string | null;
  addressLine?: string | null;
  businessJson?: Record<string, unknown> | null;
};

type WebsiteLink = { label: string; href: string };

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function mediaMaybe(path: string): string {
  return path ? mediaUrl(path) : "";
}

function normalizeWebsite(raw: string | null | undefined): WebsiteLink | null {
  const value = raw?.trim();
  if (!value) return null;
  const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const label = value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  return { label, href };
}

function readMinutes(article: NewsArticleRow): number {
  const text = (article.body || article.content || article.excerpt || "").replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 220));
}

function stripHtml(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTab(raw: string | undefined): MemberTab {
  const value = raw?.trim();
  if (value === "about" || value === "news" || value === "shop" || value === "orders" || value === "cart") {
    return value;
  }
  return "jobs";
}

function EmptyPane({
  iconClass,
  title,
  description,
}: {
  iconClass: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <i className={`${iconClass} empty-state-icon`} />
      <div className="empty-state-title">{title}</div>
      {description ? <div className="small mt-1">{description}</div> : null}
    </div>
  );
}

function ContactCard({
  contactEmail,
  phone,
  website,
  location,
}: {
  contactEmail: string;
  phone?: string | null;
  website: WebsiteLink | null;
  location: string;
}) {
  const cleanPhone = phone?.trim() || "";

  return (
    <section className="z-card" id="company-contact">
      <div className="z-card-header">
        <i className="fa-regular fa-address-card" />
        <h2 className="z-card-title">Холбоо барих</h2>
      </div>
      <ul className="sidebar-list">
        {contactEmail ? (
          <li>
            <i className="fa-regular fa-envelope" />
            <div className="meta-content">
              <div className="meta-title">И-мэйл</div>
              <div className="meta-value"><a href={`mailto:${contactEmail}`}>{contactEmail}</a></div>
            </div>
          </li>
        ) : null}
        {cleanPhone ? (
          <li>
            <i className="fa-solid fa-phone" />
            <div className="meta-content">
              <div className="meta-title">Утас</div>
              <div className="meta-value"><a href={`tel:${cleanPhone.replace(/\s+/g, "")}`}>{cleanPhone}</a></div>
            </div>
          </li>
        ) : null}
        {website ? (
          <li>
            <i className="fa-regular fa-globe" />
            <div className="meta-content">
              <div className="meta-title">Вэбсайт</div>
              <div className="meta-value"><a href={website.href} target="_blank" rel="noopener noreferrer">{website.label}</a></div>
            </div>
          </li>
        ) : null}
        {location ? (
          <li>
            <i className="fa-solid fa-location-dot" />
            <div className="meta-content">
              <div className="meta-title">Байршил</div>
              <div className="meta-value">{location}</div>
            </div>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function MetricsCard({
  industry,
  linkedin,
  facebook,
}: {
  industry: string;
  linkedin: string;
  facebook: string;
}) {
  if (!industry && !linkedin && !facebook) {
    return null;
  }

  return (
    <section className="z-card">
      <div className="z-card-header">
        <i className="fa-solid fa-chart-simple" />
        <h2 className="z-card-title">Үзүүлэлт</h2>
      </div>
      <div className="metrics-list">
        {industry ? (
          <div className="metric-item">
            <div className="metric-item-icon"><i className="fa-solid fa-briefcase" /></div>
            <div className="metric-item-info">
              <div className="metric-item-label">Салбар</div>
              <div className="metric-item-value">{industry}</div>
            </div>
          </div>
        ) : null}
        {linkedin || facebook ? (
          <div className="metric-item">
            <div className="metric-item-icon"><i className="fa-solid fa-share-nodes" /></div>
            <div className="metric-item-info">
              <div className="metric-item-label">Сошиал</div>
              <div className="metric-item-value">
                {linkedin ? <a href={linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a> : null}
                {linkedin && facebook ? " · " : ""}
                {facebook ? <a href={facebook} target="_blank" rel="noopener noreferrer">Facebook</a> : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default async function MemberPublicPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const activeTab = normalizeTab(sp.tab);
  const accountId = Number(id);
  if (!Number.isFinite(accountId) || accountId <= 0) {
    notFound();
  }

  const res = await fetch(internalApiUrl(`/api/profiles/${encodeURIComponent(id)}`), { cache: "no-store" });
  if (!res.ok) notFound();
  const json = (await res.json().catch(() => null)) as { ok?: boolean; data?: PlatformProfilePublic } | null;
  const profile = json?.data;
  if (!profile) notFound();

  const displayName = profile.displayName?.trim() || "Гишүүн";
  const biz = profile.businessJson && typeof profile.businessJson === "object" ? profile.businessJson : {};
  const memberPhotoUrl = str(biz.member_photo_url);
  const companyLogoSrc = mediaMaybe(profile.photoUrl ?? "");
  const coverSrc = mediaMaybe(str(biz.profile_cover_url));
  const responsiblePhotoSrc = mediaMaybe(memberPhotoUrl);
  const industry = str(biz.industry);
  const linkedin = str(biz.linkedin);
  const facebook = str(biz.facebook);
  const website = normalizeWebsite(profile.website);
  const location = profile.addressLine?.trim() || str(biz.company_location);
  const contactEmail = profile.businessEmail?.trim() || "";
  const contactHref = contactEmail
    ? `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(`${profile.companyName || displayName} — Холбогдох`)}`
    : "#company-contact";

  const newsPayload = await loadNewsList({ authorId: accountId, limit: 48 });

  return (
    <main className="zangia-page">
      <section className="zangia-wrap">
        <div className="zangia-shell">
          <div className="zangia-cover">
            {coverSrc ? (
              <SafeImage
                src={coverSrc}
                alt=""
                fallback={<div className="zangia-cover-fallback" />}
              />
            ) : (
              <div className="zangia-cover-fallback" />
            )}
          </div>

          <div className="zangia-brand">
            <div className="zangia-avatar">
              <SafeImage
                src={companyLogoSrc}
                alt={profile.companyName || displayName}
                fallback={<span className="fw-bold text-primary">{(profile.companyName || displayName).slice(0, 1)}</span>}
              />
              <div className="zangia-verified-badge"><i className="fa-solid fa-check" /></div>
            </div>
            <div className="brand-details">
              <h1 className="brand-name">
                {profile.companyName?.trim() || displayName}
                <i className="fa-solid fa-circle-check" title="Verified" />
              </h1>
              <div className="brand-meta">
                <div className="brand-meta-item">
                  {responsiblePhotoSrc ? (
                    <SafeImage
                      src={responsiblePhotoSrc}
                      alt={displayName}
                      className="brand-member-photo"
                      fallback={<i className="fa-regular fa-user" />}
                    />
                  ) : (
                    <i className="fa-regular fa-user" />
                  )}
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Хариуцсан хүн</div>
                    <div style={{ fontWeight: 500, color: "#111827" }}>{displayName}</div>
                  </div>
                </div>
                {website ? (
                  <div className="brand-meta-item">
                    <i className="fa-regular fa-globe" />
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Вэбсайт</div>
                      <div style={{ fontWeight: 500, color: "#111827" }}>
                        <a href={website.href} target="_blank" rel="noopener noreferrer">
                          {website.label} <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.7rem", marginLeft: 2 }} />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : null}
                {location ? (
                  <div className="brand-meta-item">
                    <i className="fa-solid fa-location-dot" />
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Байршил</div>
                      <div style={{ fontWeight: 500, color: "#111827" }}>{location}</div>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="brand-actions">
                <a href={contactHref} className="btn-brand-primary" title="И-мэйл, утас эсвэл холбоо барих хэсэг рүү">
                  <i className="fa-regular fa-message" /> Холбогдох
                </a>
                {website ? (
                  <a href={website.href} target="_blank" rel="noopener noreferrer" className="btn-brand-outline">
                    Вэбсайт үзэх <i className="fa-solid fa-arrow-up-right-from-square" />
                  </a>
                ) : null}
                <MemberFollowButton accountId={accountId} />
              </div>
            </div>
          </div>

          <div className="zangia-tabs">
            <Link href={`/member/${accountId}?tab=jobs`} className={activeTab === "jobs" ? "active" : ""}>Ажлын зар</Link>
            <Link href={`/member/${accountId}?tab=about`} className={activeTab === "about" ? "active" : ""}>Компанийн тухай</Link>
            <Link href={`/member/${accountId}?tab=news`} className={activeTab === "news" ? "active" : ""}>Мэдээ мэдээлэл</Link>
            <Link href={`/member/${accountId}?tab=shop`} className={activeTab === "shop" ? "active" : ""}>Дэлгүүр</Link>
            <Link href={`/member/${accountId}?tab=orders`} className={activeTab === "orders" ? "active" : ""}>Өгсөн захиалга</Link>
            <Link href={`/member/${accountId}?tab=cart`} className={activeTab === "cart" ? "active" : ""}>Cart <span className="cart-pill">0</span></Link>
          </div>

          {activeTab === "jobs" ? (
            <div className="zangia-pane">
              <h2 className="h5 fw-bold mb-3">Ажлын зарууд</h2>
              <EmptyPane iconClass="fa-regular fa-briefcase" title="Одоогоор нээлттэй ажлын зар байхгүй байна." />
            </div>
          ) : null}

          {activeTab === "about" ? (
            <div className="layout-grid">
              <div>
                <section className="z-card">
                  <div className="z-card-header">
                    <i className="fa-regular fa-building" />
                    <h2 className="z-card-title">Компанийн тухай</h2>
                  </div>
                  <p className="z-text">{stripHtml(profile.bio) || "Компанийн танилцуулга одоогоор бүртгэгдээгүй байна."}</p>
                </section>
                <section className="z-card">
                  <div className="z-card-header">
                    <i className="fa-solid fa-circle-info" />
                    <h2 className="z-card-title">Ерөнхий мэдээлэл</h2>
                  </div>
                  <div className="grid-2">
                    {industry ? (
                      <div className="mini-card">
                        <div className="mini-card-icon blue"><i className="fa-solid fa-briefcase" /></div>
                        <div>
                          <div className="mini-card-title">Салбар</div>
                          <p className="mini-card-desc">{industry}</p>
                        </div>
                      </div>
                    ) : null}
                    {str(biz.founded_year) ? (
                      <div className="mini-card">
                        <div className="mini-card-icon"><i className="fa-regular fa-calendar" /></div>
                        <div>
                          <div className="mini-card-title">Байгуулагдсан он</div>
                          <p className="mini-card-desc">{str(biz.founded_year)}</p>
                        </div>
                      </div>
                    ) : null}
                    {str(biz.company_size) ? (
                      <div className="mini-card">
                        <div className="mini-card-icon"><i className="fa-solid fa-users" /></div>
                        <div>
                          <div className="mini-card-title">Ажилтны тоо</div>
                          <p className="mini-card-desc">{str(biz.company_size)}</p>
                        </div>
                      </div>
                    ) : null}
                    {str(biz.legal_form) ? (
                      <div className="mini-card">
                        <div className="mini-card-icon"><i className="fa-regular fa-file-lines" /></div>
                        <div>
                          <div className="mini-card-title">Хуулийн хэлбэр</div>
                          <p className="mini-card-desc">{str(biz.legal_form)}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>
              </div>
              <aside>
                <ContactCard
                  contactEmail={contactEmail}
                  phone={profile.businessPhone}
                  website={website}
                  location={location}
                />
                <MetricsCard industry={industry} linkedin={linkedin} facebook={facebook} />
              </aside>
            </div>
          ) : null}

          {activeTab === "news" ? (
            <div className="zangia-pane">
              <h2 className="h5 fw-bold mb-3">Мэдээ мэдээлэл</h2>
              {newsPayload.rows.length === 0 ? (
                <EmptyPane iconClass="fa-regular fa-newspaper" title="Одоогоор мэдээ байхгүй байна." />
              ) : (
                <div className="grid-2">
                  {newsPayload.rows.map((row) => {
                    const slug = newsCategorySlug(row.category);
                    return (
                      <Link href={`/news/${row.slug || row.id}`} className="news-card text-decoration-none" key={row.id}>
                        <SafeImage
                          src={row.image ? mediaUrl(row.image) : ""}
                          alt={row.title}
                          className="news-card-img"
                          fallback={<div className="news-card-img d-flex align-items-center justify-content-center"><i className={newsCategoryIcon(slug)} /></div>}
                        />
                        <div className="news-card-body">
                          <div className="news-card-title">{row.title}</div>
                          <div className="news-card-desc">{newsCategoryLabel(slug)} · {readMinutes(row)} мин</div>
                          <div className="news-card-footer">
                            <span className="news-card-date">{formatMnDate(row.createdAt)}</span>
                            <span className="news-card-link">Дэлгэрэнгүй</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "shop" ? (
            <div className="zangia-pane">
              <h2 className="h5 fw-bold mb-3">Дэлгүүр</h2>
              <EmptyPane
                iconClass="fa-solid fa-cart-shopping"
                title="Одоогоор бүтээгдэхүүн бүртгэгдээгүй байна."
                description="Энэ байгууллагын дэлгүүрийн бараа нэмэгдэхэд энд харагдана."
              />
            </div>
          ) : null}

          {activeTab === "orders" ? (
            <div className="zangia-pane">
              <h2 className="h5 fw-bold mb-3">Өгсөн захиалга</h2>
              <EmptyPane
                iconClass="fa-regular fa-receipt"
                title="Захиалга харах боломжгүй байна."
                description="Захиалгын мэдээлэл харахын тулд нэвтэрнэ үү."
              />
            </div>
          ) : null}

          {activeTab === "cart" ? (
            <div className="zangia-pane">
              <h2 className="h5 fw-bold mb-3">Cart</h2>
              <EmptyPane
                iconClass="fa-solid fa-basket-shopping"
                title="Сагс хоосон байна."
                description="Дэлгүүрээс бүтээгдэхүүн сонгоход таны сагс энд харагдана."
              />
            </div>
          ) : null}

          {activeTab === "jobs" ? (
            <div className="layout-grid mt-4">
              <div>
                <section className="z-card">
                <div className="z-card-header">
                  <i className="fa-regular fa-building" />
                  <h2 className="z-card-title">Компанийн тухай</h2>
                </div>
                <p className="z-text">{stripHtml(profile.bio) || industry || "Компанийн танилцуулга одоогоор бүртгэгдээгүй байна."}</p>
              </section>

              <section className="z-card">
                <div className="z-card-header">
                  <i className="fa-regular fa-newspaper" />
                  <h2 className="z-card-title">Мэдээ мэдээлэл</h2>
                  <Link href="/news" className="z-card-link">Бүгдийг харах <i className="fa-solid fa-arrow-right" /></Link>
                </div>
                {newsPayload.rows.length === 0 ? (
                  <div className="empty-state">
                    <i className="fa-regular fa-newspaper empty-state-icon" />
                    <div className="empty-state-title">Одоогоор мэдээ байхгүй байна.</div>
                  </div>
                ) : (
                  <div className="grid-2">
                    {newsPayload.rows.slice(0, 4).map((row) => {
                      const slug = newsCategorySlug(row.category);
                      return (
                        <Link href={`/news/${row.slug || row.id}`} className="news-card text-decoration-none" key={row.id}>
                          <SafeImage
                            src={row.image ? mediaUrl(row.image) : ""}
                            alt={row.title}
                            className="news-card-img"
                            fallback={<div className="news-card-img d-flex align-items-center justify-content-center"><i className={newsCategoryIcon(slug)} /></div>}
                          />
                          <div className="news-card-body">
                            <div className="news-card-title">{row.title}</div>
                            <div className="news-card-desc">{newsCategoryLabel(slug)} · {readMinutes(row)} мин</div>
                            <div className="news-card-footer">
                              <span className="news-card-date">{formatMnDate(row.createdAt)}</span>
                              <span className="news-card-link">Дэлгэрэнгүй</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

              <aside>
                <ContactCard
                  contactEmail={contactEmail}
                  phone={profile.businessPhone}
                  website={website}
                  location={location}
                />
                <MetricsCard industry={industry} linkedin={linkedin} facebook={facebook} />
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
