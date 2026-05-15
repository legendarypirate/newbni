import Link from "next/link";
import { cookies } from "next/headers";

import HomeTripRegisterDrawer from "@/components/home/HomeTripRegisterDrawer";
import SafeImage from "@/components/SafeImage";
import { formatMnDate } from "@/lib/format-date";
import type { HomePayload } from "@/lib/home-data";
import { loadHomeData } from "@/lib/home-data";
import { createServerT, getLangFromCookies } from "@/lib/i18n/server";
import { mediaUrl } from "@/lib/media-url";

type TFn = (key: string) => string;

export const dynamic = "force-dynamic";

const PLACEHOLDER_TRIP = "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80";
const PLACEHOLDER_EVENT = "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80";
const PLACEHOLDER_NEWS = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80";

function stripHtmlToPlainText(raw: string | null | undefined): string {
  return (raw ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function short(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function assetUrl(path: string | null | undefined, folder?: "members" | "news"): string {
  const p = (path ?? "").trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p) || p.startsWith("/")) return mediaUrl(p);
  return folder ? mediaUrl(`/uploads/${folder}/${p}`) : mediaUrl(p);
}

function tripDate(t: TFn, start?: string | null, end?: string | null): string {
  if (!start) return t("common.dateSoon");
  return `${formatMnDate(start)}${end ? ` - ${formatMnDate(end).slice(5)}` : ""}`;
}

function HeroV3({ data, t }: { data: HomePayload; t: TFn }) {
  const hero = data.heroTrip;
  const heroTitle = (hero?.destination ?? "Ирэх аялал").trim() || "Ирэх аялал";
  const heroImg =
    mediaUrl(hero?.coverImageUrl ?? "") ||
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=100&q=80";
  const tripTotal = data.stats.tripTotal || 0;
  const tripActive = data.stats.tripActive || 0;
  const eventTotal = data.stats.eventTotal || 0;
  const eventActive = data.stats.eventActive || 0;
  const registrationTotal = data.stats.registrationTotal || 0;
  const registrationNew = data.stats.registrationNew || 0;
  const revenueMonth = data.stats.revenueMonth || 0;
  const tripPct = tripTotal > 0 ? Math.round((tripActive / tripTotal) * 100) : 0;

  return (
    <section className="hero-v3">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <div className="hero-content-left">
              <h1 className="hero-headline">{t("home.hero.headline")}</h1>
              <p className="hero-subheadline">{t("home.hero.subheadline")}</p>
              <div className="hero-btns">
                <Link href="/auth/login" className="btn-hero-primary">
                  <i className="fa-solid fa-paper-plane" />
                  {t("home.hero.createTrip")}
                </Link>
                <Link href="/auth/login" className="btn-hero-outline">
                  {t("home.hero.createEvent")}
                </Link>
              </div>
              <Link href="#" className="hero-how-it-works">
                <i className="fa-solid fa-circle-play" />
                {t("home.hero.howItWorks")}
              </Link>
            </div>
          </div>
          <div className="col-lg-6 mt-5 mt-lg-0">
            <div className="dashboard-mockup">
              <div className="mockup-sidebar d-none d-md-flex">
                <div className="mockup-logo">BUSY.mn</div>
                <div className="sidebar-nav-item active"><i className="fa-solid fa-house" /> {t("home.mockup.home")}</div>
                <div className="sidebar-nav-item"><i className="fa-solid fa-paper-plane" /> {t("home.mockup.trips")}</div>
                <div className="sidebar-nav-item"><i className="fa-solid fa-calendar-days" /> {t("home.mockup.events")}</div>
                <div className="sidebar-nav-item"><i className="fa-solid fa-user-check" /> {t("home.mockup.registrations")}</div>
                <div className="sidebar-nav-item"><i className="fa-solid fa-credit-card" /> {t("home.mockup.payments")}</div>
                <div className="sidebar-nav-item"><i className="fa-solid fa-clock" /> {t("home.mockup.schedule")}</div>
                <div className="sidebar-nav-item"><i className="fa-solid fa-chart-pie" /> {t("home.mockup.reports")}</div>
              </div>
              <div className="mockup-main">
                <div className="mockup-header">
                  <div className="mockup-title">{t("home.mockup.overview")}</div>
                  <div className="d-flex gap-2 align-items-center">
                    <i className="fa-regular fa-bell text-muted" />
                    <div className="rounded-circle bg-secondary" style={{ width: 24, height: 24 }} />
                  </div>
                </div>
                <div className="mockup-stats-grid">
                  <div className="mockup-stat-card"><span className="stat-card-label">{t("home.mockup.tripsLabel")}</span><span className="stat-card-val">{tripTotal}</span><span className="stat-card-sub">{t("home.mockup.active")} {tripActive}</span></div>
                  <div className="mockup-stat-card"><span className="stat-card-label">{t("home.mockup.eventsLabel")}</span><span className="stat-card-val">{eventTotal}</span><span className="stat-card-sub">{t("home.mockup.active")} {eventActive}</span></div>
                  <div className="mockup-stat-card"><span className="stat-card-label">{t("home.mockup.registrationsLabel")}</span><span className="stat-card-val">{registrationTotal}</span><span className="stat-card-sub">{t("home.mockup.active")} {registrationNew}</span></div>
                  <div className="mockup-stat-card"><span className="stat-card-label">{t("home.mockup.revenue")}</span><span className="stat-card-val">{(revenueMonth / 1000000).toFixed(1)}М</span><span className="stat-card-sub">{t("home.mockup.thisMonth")}</span></div>
                </div>
                <div className="mockup-activity-section">
                  <div className="activity-card">
                    <div className="activity-card-header">
                      <span className="activity-card-title">{t("home.mockup.upcomingActivity")}</span>
                      <span className="activity-card-tag">{t("home.mockup.active")}</span>
                    </div>
                    <div className="activity-item-preview">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroImg} className="item-preview-img" alt={heroTitle} />
                      <div className="item-preview-info">
                        <span className="name">{short(heroTitle, 56)}</span>
                        <span className="meta">{hero ? tripDate(t, hero.startDate, hero.endDate) : t("common.dateSoon")}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-muted">{t("home.mockup.totalTrips")}: {tripTotal}</span>
                        <span className="text-muted">{tripPct}%</span>
                      </div>
                      <div className="progress" style={{ height: 4 }}>
                        <div className="progress-bar bg-primary" style={{ width: `${tripPct}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="registrations-card">
                    <div className="reg-list-title">{t("home.mockup.recentRegs")}</div>
                    {data.recentOrders.length > 0 ? (
                      data.recentOrders.slice(0, 3).map((order, idx) => (
                        <div className="reg-item" key={order.orderRef}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`https://i.pravatar.cc/50?u=order-${idx}`} className="reg-avatar" alt="User" />
                          <span className="reg-ref">#{order.orderRef}</span>
                          <span className="reg-date ms-auto text-muted">{formatMnDate(order.createdAt)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="reg-item">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://i.pravatar.cc/50?u=empty" className="reg-avatar" alt="User" />
                        <span>{t("home.mockup.noRegs")}</span>
                        <span className="ms-auto text-muted">-</span>
                      </div>
                    )}
                    <Link href="/platform" className="d-block text-center small text-primary mt-2">{t("common.viewAll")}</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnersSection({ data, t }: { data: HomePayload; t: TFn }) {
  return (
    <section className="partners-section">
      <div className="container">
        <div className="partners-head">
          <h2 className="partners-title">{t("home.partners.title")}</h2>
          <div className="partners-head-right">
            <span className="partners-subtitle">{t("home.partners.subtitle")}</span>
            <div className="partner-controls" aria-label="Гишүүн байгууллагууд слайдер удирдлага">
              <button type="button" className="partner-control-btn" aria-label={t("home.partners.prev")}><i className="fa-solid fa-chevron-left" /></button>
              <button type="button" className="partner-control-btn" aria-label={t("home.partners.next")}><i className="fa-solid fa-chevron-right" /></button>
            </div>
          </div>
        </div>
        <div className="partner-slider">
          <div className="partner-viewport">
            <div className="partner-track">
              {data.partners.length > 0 ? (
                data.partners.map((p) => (
                  <Link href={p.href || "/members"} className="partner-card partner-card-link" key={`${p.name}-${p.href}`}>
                    <div className="partner-logo-shell">
                      {p.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(p.logo)} className="partner-logo-img" alt={p.name} loading="lazy" />
                      ) : (
                        <span className="partner-fallback-icon"><i className="fa-solid fa-building" /></span>
                      )}
                    </div>
                    <span className="partner-name">{p.name}</span>
                  </Link>
                ))
              ) : (
                <div className="partner-card">
                  <div className="partner-logo-shell"><span className="partner-fallback-icon"><i className="fa-solid fa-building" /></span></div>
                  <span className="partner-name">{t("home.partners.empty")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TripsSection({ data, t }: { data: HomePayload; t: TFn }) {
  return (
    <section className="py-5">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="section-title-v2 m-0">{t("home.sections.intlTrips")}</h2>
          <Link href="/trips" className="text-primary small text-decoration-none">{t("common.viewAll")}</Link>
        </div>
        <div className="trips-v3-grid">
          {data.businessTrips.length > 0 ? (
            data.businessTrips.slice(0, 3).map((trip) => {
              const title = trip.destination || t("home.trips.defaultTitle");
              const desc = stripHtmlToPlainText(trip.description) || t("home.trips.descSoon");
              const status = trip.statusLabel || t("home.mockup.active");
              return (
                <div className="trip-card-exact" key={trip.id}>
                  <div className="trip-exact-img-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl(trip.coverImageUrl) || PLACEHOLDER_TRIP} className="trip-exact-img" alt={title} />
                    <span className={`trip-status-tag ${status !== t("home.mockup.active") ? "inactive" : ""}`}>{status}</span>
                  </div>
                  <div className="trip-exact-body">
                    <h3 className="trip-exact-title">{title}</h3>
                    <div className="trip-exact-date text-primary">{tripDate(t, trip.startDate, trip.endDate)}</div>
                    <p className="trip-exact-desc">{short(desc, 120)}</p>
                    <div className="trip-exact-btns">
                      <button type="button" className="btn-qpay js-trip-register-btn" data-trip-title={title} data-trip-id={String(trip.id)}>{t("common.register")}</button>
                      <Link href={`/trip-details/${trip.id}`} className="btn-exact-outline text-center">{t("common.details")}</Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="trip-card-exact"><div className="trip-exact-body"><h3 className="trip-exact-title">{t("home.trips.empty")}</h3><p className="trip-exact-desc">{t("home.trips.emptyHint")}</p></div></div>
          )}
        </div>
      </div>
    </section>
  );
}

function CoreActivitiesSection({ data, t }: { data: HomePayload; t: TFn }) {
  const event = data.coreEvents[0];
  const eventImage = event?.bannerImage ? mediaUrl(event.bannerImage) : PLACEHOLDER_EVENT;
  return (
    <section className="py-5">
      <div className="container">
        <h2 className="section-title-v2 mb-4">{t("home.sections.coreActivities")}</h2>
        <div className="activities-tabs">
          <button type="button" className="activity-tab active">{t("home.events.tab")}</button>
        </div>
        <div className="activity-pane active">
          <div className="activity-main-grid">
            <div className="upcoming-meeting-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={eventImage} className="meeting-card-img" alt={event?.title || "Эвент"} />
              <div className="meeting-card-body">
                <div className="text-muted small mb-2">{t("home.events.upcoming")}</div>
                <h3 className="meeting-card-title">{event?.title || t("home.events.noTitle")}</h3>
                <div className="meeting-card-meta">
                  <span><i className="fa-regular fa-calendar me-2" /> {event?.startsAt ? formatMnDate(event.startsAt) : t("common.dateSoon")}</span>
                  <span><i className="fa-solid fa-location-dot me-2" /> {event?.location || t("home.events.locationSoon")}</span>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">Идэвхтэй уулзалт {data.coreEvents.length}</span>
                    <span className="text-muted">{data.coreEvents.length ? "100%" : "0%"}</span>
                  </div>
                  <div className="progress" style={{ height: 6, borderRadius: 3 }}>
                    <div className="progress-bar bg-primary" style={{ width: data.coreEvents.length ? "100%" : "0%" }} />
                  </div>
                </div>
                <Link href={event ? `/events/${event.id}` : "/events"} className="btn btn-outline-primary btn-sm rounded-pill px-4">{t("common.details")}</Link>
              </div>
            </div>
            <div className="featured-members-box">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="m-0" style={{ fontSize: "0.95rem", fontWeight: 800 }}>{t("home.events.nearEvents")}</h4>
                <Link href="/events" className="small text-primary text-decoration-none">{t("common.viewAll")}</Link>
              </div>
              <div className="event-mini-list">
                {data.coreEvents.length > 0 ? (
                  data.coreEvents.map((evt) => (
                    <Link href={`/events/${evt.id}`} className="event-mini-item text-decoration-none text-reset" key={evt.id}>
                      <div className="event-mini-title">{evt.title}</div>
                      <div className="event-mini-meta">
                        <span><i className="fa-regular fa-calendar me-1" /> {formatMnDate(evt.startsAt)}</span>
                        <span><i className="fa-solid fa-location-dot me-1" /> {evt.location || "Байршил шинэчлэгдэнэ"}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="event-mini-empty">{t("home.events.empty")}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedMembersSection({ data, t }: { data: HomePayload; t: TFn }) {
  return (
    <section className="py-4">
      <div className="container">
        <div className="featured-members-box">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="section-title-v2 m-0">{t("home.sections.featuredMembers")}</h2>
            <Link href="/members" className="small text-primary text-decoration-none">{t("common.viewAll")}</Link>
          </div>
          <div className="featured-members-grid">
            {data.featuredMembers.length > 0 ? (
              data.featuredMembers.slice(0, 4).map((member) => (
                <div className="featured-member-item" key={member.id}>
                  <div className="member-item-logo featured-member-logo">
                    <SafeImage
                      src={assetUrl(member.photo, "members")}
                      alt={member.company || member.name}
                      loading="lazy"
                      fallback={<span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b" }}>{member.name.charAt(0)}</span>}
                    />
                  </div>
                  <div className="featured-member-name">{short(member.company || member.name, 24)}</div>
                </div>
              ))
            ) : (
              <div className="member-item-logo" style={{ background: "#f1f5f9", border: "none", fontSize: "0.7rem", fontWeight: "bold", color: "#cbd5e1" }}>{t("home.sections.members")}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function BottomGridSection({ data, t }: { data: HomePayload; t: TFn }) {
  return (
    <section className="py-5">
      <div className="container">
        <div className="row">
          <div className="col-lg-6">
            <h2 className="section-title-v2 mb-4">{t("home.sections.investmentSectors")}</h2>
            <div className="investment-grid">
              <div className="investment-sector-card">
                <div className="sector-header"><div className="sector-title">{t("home.investment.manufacturing")}</div><div className="sector-stats"><span className="sector-count">124</span><span className="text-muted small">{t("home.investment.projects")}</span><span className="sector-growth">+18%</span></div><div className="text-muted small">{t("home.investment.year")}</div></div>
                <div className="sector-chart"><svg viewBox="0 0 200 60" width="100%" height="100%" preserveAspectRatio="none"><path d="M0,50 L20,45 L40,48 L60,40 L80,35 L100,38 L120,30 L140,25 L160,28 L180,20 L200,15" fill="none" stroke="#10b981" strokeWidth="2" /><circle cx="200" cy="15" r="3" fill="#10b981" /></svg></div>
              </div>
              <div className="investment-sector-card">
                <div className="sector-header"><div className="sector-title">{t("home.investment.tech")}</div><div className="sector-stats"><span className="sector-count">98</span><span className="text-muted small">төсөл</span><span className="sector-growth">+24%</span></div><div className="text-muted small">(2025 он)</div></div>
                <div className="sector-chart"><svg viewBox="0 0 200 60" width="100%" height="100%" preserveAspectRatio="none"><path d="M0,55 L20,50 L40,52 L60,45 L80,48 L100,35 L120,38 L140,30 L160,25 L180,22 L200,10" fill="none" stroke="#3b82f6" strokeWidth="2" /><circle cx="200" cy="10" r="3" fill="#3b82f6" /></svg></div>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="d-flex justify-content-between align-items-center mb-4 mt-5 mt-lg-0">
              <h2 className="section-title-v2 m-0">{t("home.sections.newsFeed")}</h2>
              <Link href="/news" className="text-primary small text-decoration-none">{t("common.viewAll")}</Link>
            </div>
            <div className="news-exact-grid">
              {data.latestNews.length > 0 ? (
                data.latestNews.slice(0, 3).map((article) => (
                  <div className="news-card-exact" key={article.id}>
                    <SafeImage
                      src={assetUrl(article.image, "news") || PLACEHOLDER_NEWS}
                      alt={article.title}
                      loading="lazy"
                      className="news-exact-img"
                      fallback={<div className="news-exact-img d-flex align-items-center justify-content-center text-muted" style={{ background: "#f1f5f9" }}><i className="fa-regular fa-image" style={{ fontSize: "1.4rem" }} /></div>}
                    />
                    <div className="news-exact-body">
                      <h3 className="news-exact-title">{short(article.title, 80)}</h3>
                      <div className="news-exact-date">{formatMnDate(article.createdAt)}</div>
                      <Link href={`/news/${article.slug || article.id}`} className="small text-primary text-decoration-none d-block mt-2">{t("common.details")}</Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="news-card-exact"><div className="news-exact-body"><h3 className="news-exact-title">{t("home.news.empty")}</h3><div className="news-exact-date">-</div></div></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const lang = getLangFromCookies(await cookies());
  const t = createServerT(lang);
  const data = await loadHomeData(lang);
  return (
    <main className="home-page-v3">
      <HeroV3 data={data} t={t} />
      <PartnersSection data={data} t={t} />
      <TripsSection data={data} t={t} />
      <CoreActivitiesSection data={data} t={t} />
      <FeaturedMembersSection data={data} t={t} />
      <BottomGridSection data={data} t={t} />
      <HomeTripRegisterDrawer />
    </main>
  );
}
