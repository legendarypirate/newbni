import Link from "next/link";
import { MarketingListingHero } from "@/components/marketing/MarketingListingHero";
import { TripsFilterBudgetInputs } from "@/components/trips/TripsFilterBudgetInputs";
import SafeImage from "@/components/SafeImage";
import { formatMnDate } from "@/lib/format-date";
import { getMarketingListingHeroSlides } from "@/lib/marketing-listing-hero";
import { mediaUrl } from "@/lib/media-url";
import { ContentLikeButton } from "@/components/ContentLikeButton";
import { apiLangHeaders, createServerT, getServerLang, withLangQuery } from "@/lib/i18n/server";
import { serverAuthedFetch } from "@/lib/server-authed-fetch";

export const dynamic = "force-dynamic";

const PLACEHOLDER_TRIP = "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80";

type SearchParams = {
  country?: string;
  focus?: string;
  date_from?: string;
  date_to?: string;
  trip_type?: string;
  budget_max?: string;
};

export default async function TripsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const lang = await getServerLang();
  const t = createServerT(lang);
  const sp = await searchParams;
  const country = sp.country?.trim() || "";
  const focus = sp.focus?.trim() || "";
  const dateFrom = sp.date_from?.trim() || "";
  const dateTo = sp.date_to?.trim() || "";
  const validTypes = ["all", "near", "vip", "factory", "expo", "trip"];
  const tripType = validTypes.includes(sp.trip_type?.trim() || "") ? sp.trip_type!.trim() : "all";
  const budgetMax = Math.max(0, parseInt(sp.budget_max || "0", 10));

  const urlParams = new URLSearchParams();
  if (country) urlParams.set("country", country);
  if (focus) urlParams.set("focus", focus);
  if (dateFrom) urlParams.set("date_from", dateFrom);
  if (dateTo) urlParams.set("date_to", dateTo);
  urlParams.set("trip_type", tripType);
  if (budgetMax > 0) urlParams.set("budget_max", budgetMax.toString());

  const apiPath = withLangQuery(`/platform/trips?${urlParams.toString()}`, lang);
  const res = await serverAuthedFetch(apiPath, {
    headers: apiLangHeaders(lang),
  })
    .then((r) => r.json())
    .catch(() => ({ ok: false }));
  const data = res.ok ? res.data : { trips: [], totalTrips: 0, nearTrips: 0, registeredMembers: 0 };

  const { trips, totalTrips, nearTrips, registeredMembers } = data;

  const featuredTrips = [];
  const tripCards = [];

  if (tripType === 'all') {
    for (const trip of trips) {
      if (trip.isFeatured === 1 && featuredTrips.length < 3) {
        featuredTrips.push(trip);
      } else {
        tripCards.push(trip);
      }
    }
  } else {
    if (trips.length > 0) {
      featuredTrips.push(trips[0]);
      tripCards.push(...trips.slice(1));
    }
  }

  const limitedTripCards = tripCards.slice(0, 12);
  const featuredTrip = featuredTrips[0] ?? null;

  const heroSlidesRaw = await getMarketingListingHeroSlides("trips");
  const heroSlides = heroSlidesRaw.map((u) => mediaUrl(u) || u).filter(Boolean);
  const heroFallback = "/assets/img/busy-background.png";

  return (
    <main className="page-content" style={{ backgroundColor: "var(--bg-page)" }}>
      <MarketingListingHero slides={heroSlides} fallbackImageUrl={heroFallback}>
        <h1 className="fw-bold" style={{ fontSize: "2.25rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>
          {t("trips.title")}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
          {t("trips.subtitle")}
        </p>
      </MarketingListingHero>

      <div className="container trips-layout mt-5 mb-5">
        
        {/* Left Sidebar: Filter */}
        <aside className="trips-sidebar-left">
          <div className="sidebar-widget">
            <h3 className="widget-title">{t("trips.searchTitle")}</h3>
            <form method="get" action="/trips">
              <div className="filter-group">
                <label className="filter-label">{t("trips.country")}</label>
                <input type="text" className="filter-input" name="country" defaultValue={country} placeholder={t("trips.countryPh")} />
              </div>
              
              <div className="filter-group">
                <label className="filter-label">{t("trips.startDate")}</label>
                <div className="position-relative">
                  <input type="date" className="filter-input" name="date_from" defaultValue={dateFrom} />
                  <i className="fa-regular fa-calendar position-absolute" style={{ right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}></i>
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-label">{t("trips.endDate")}</label>
                <div className="position-relative">
                  <input type="date" className="filter-input" name="date_to" defaultValue={dateTo} />
                  <i className="fa-regular fa-calendar position-absolute" style={{ right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}></i>
                </div>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">{t("trips.sector")}</label>
                <select className="filter-select" name="focus" defaultValue={focus}>
                  <option value="">{t("trips.sectorPh")}</option>
                  <option value="Инноваци">Инноваци, Технологи</option>
                  <option value="Худалдаа">Худалдаа, Ложистик</option>
                  <option value="Үйлдвэр">Үйлдвэрлэл</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">{t("trips.budget")}</label>
                <TripsFilterBudgetInputs budgetMaxFromUrl={budgetMax} />
              </div>
              
              <div className="filter-group">
                <label className="filter-label">{t("trips.tripType")}</label>
                <select className="filter-select" name="trip_type" defaultValue={tripType}>
                  <option value="all">{t("trips.tabAll")}</option>
                  <option value="trip">{t("trips.typeBusiness")}</option>
                  <option value="factory">{t("trips.typeFactory")}</option>
                  <option value="expo">{t("trips.typeExpo")}</option>
                  <option value="vip">VIP</option>
                  <option value="near">{t("trips.tabNear")}</option>
                </select>
              </div>

              <button type="submit" className="btn-brand w-100 mb-2">{t("common.search")}</button>
              <Link href="/trips" className="btn-brand-outline w-100 d-inline-block text-center" style={{ color: "var(--brand-primary)", borderColor: "var(--border-color)" }}>{t("common.clearFilters")}</Link>
            </form>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="trips-main-content">
          {/* Tabs */}
          <div className="trips-tabs">
            <Link className={`trip-tab ${tripType === 'all' ? 'active' : ''}`} href="/trips?trip_type=all">{t("trips.tabAll")}</Link>
            <Link className={`trip-tab ${tripType === 'near' ? 'active' : ''}`} href="/trips?trip_type=near">{t("trips.tabNear")}</Link>
            <Link className={`trip-tab ${tripType === 'vip' ? 'active' : ''}`} href="/trips?trip_type=vip">VIP</Link>
            <Link className={`trip-tab ${tripType === 'factory' ? 'active' : ''}`} href="/trips?trip_type=factory">{t("trips.tabFactory")}</Link>
            <Link className={`trip-tab ${tripType === 'expo' ? 'active' : ''}`} href="/trips?trip_type=expo">{t("trips.tabExpo")}</Link>
          </div>

          {/* Featured Large Card(s) */}
          {featuredTrips.map((ftrip) => (
            <div className="featured-trip-card featured-trip-card-stack" key={ftrip.id}>
              <div className="position-relative">
                <SafeImage
                  src={mediaUrl(ftrip.coverImageUrl) || PLACEHOLDER_TRIP}
                  alt={ftrip.destination}
                  loading="lazy"
                  className="featured-trip-img"
                  fallback={
                    <div
                      className="featured-trip-img d-flex align-items-center justify-content-center text-muted"
                      style={{ background: "#f1f5f9" }}
                    >
                      <i className="fa-regular fa-image" style={{ fontSize: "2rem" }} />
                    </div>
                  }
                />
              </div>
              <div className="featured-trip-content">
                <div className="featured-trip-header">
                  <div>
                    <span className="featured-badge mb-2 d-inline-block">{t("trips.featuredBadge")}</span>
                    <h2 className="featured-trip-title">{ftrip.destination}</h2>
                    <div className="featured-trip-meta">
                      <span><i className="fa-regular fa-calendar me-1"></i> {formatMnDate(ftrip.startDate)} - {formatMnDate(ftrip.endDate)}</span>
                    </div>
                    <div className="mb-3">
                      <span className="trip-card-badge me-2" style={{ background: "#f3f4f6" }}>{t("trips.tripTypeLabel")}</span>
                      <span className="trip-card-badge">{ftrip.focus || 'Business Trip'}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>{t("trips.programBrief")}</div>
                <ul className="featured-trip-features">
                  <li><i className="fa-solid fa-check"></i> {(ftrip.description || 'Бизнесийн уулзалт, танилцах хөтөлбөр.').slice(0, 120)}</li>
                  <li><i className="fa-solid fa-check"></i> B2B уулзалт, сүлжээ тогтоох боломж</li>
                  <li><i className="fa-solid fa-check"></i> Зах зээлийн бодит туршлага судлах</li>
                </ul>
                
                <div className="featured-trip-footer">
                  <div>
                    {ftrip.priceMnt ? (
                      <div className="featured-trip-price">
                        {`₮${Number(ftrip.priceMnt).toLocaleString()}`}
                      </div>
                    ) : null}
                  </div>
                  <div className="featured-trip-actions">
                    <div className="seats-badge">
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Үлдсэн суудал</div>
                      <div className="seats-count">{ftrip.seatsLabel || 'Мэдээлэл шинэчлэгдэнэ'}</div>
                    </div>
                    <div className="featured-trip-cta trip-list-actions">
                      <Link href={`/trip-details/${ftrip.id}`} className="btn-brand">Бүртгүүлэх</Link>
                      <Link href={`/trip-details/${ftrip.id}`} className="btn-brand-outline">Дэлгэрэнгүй</Link>
                      <ContentLikeButton
                        targetType="trip"
                        targetId={ftrip.id}
                        initialCount={Number((ftrip as { likeCount?: number }).likeCount ?? 0)}
                        initialLiked={Boolean((ftrip as { likedByMe?: boolean }).likedByMe)}
                        layout="inline"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Small Trip Cards Grid */}
          <div className="trips-grid">
            {limitedTripCards.length > 0 ? (
              limitedTripCards.map((trip) => (
                <div className="trip-card-v4" key={trip.id}>
                  <div className="trip-img-wrap">
                    <SafeImage
                      src={mediaUrl(trip.coverImageUrl) || PLACEHOLDER_TRIP}
                      alt={trip.destination}
                      loading="lazy"
                      fallback={
                        <div
                          className="d-flex align-items-center justify-content-center text-muted w-100 h-100"
                          style={{ background: "#f1f5f9" }}
                        >
                          <i className="fa-regular fa-image" style={{ fontSize: "1.5rem" }} />
                        </div>
                      }
                    />
                    <div className="trip-date-overlay"><i className="fa-regular fa-calendar me-1"></i> {formatMnDate(trip.startDate)} - {formatMnDate(trip.endDate)}</div>
                  </div>
                  <div className="trip-card-body">
                    <h3 className="trip-card-title">{trip.destination}</h3>
                    <div>
                      <span className="trip-card-badge">{trip.focus || 'Business Trip'}</span>
                    </div>
                    <div className="trip-card-footer">
                      <div className="d-flex justify-content-between align-items-center">
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Үлдсэн суудал <span style={{ fontWeight: 700, color: "var(--text-main)", marginLeft: "0.2rem" }}>{trip.seatsLabel || '-'}</span></div>
                      </div>
                      {trip.priceMnt ? (
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="featured-trip-price" style={{ fontSize: "1.1rem" }}>
                            {`₮${Number(trip.priceMnt).toLocaleString()}`}
                          </div>
                        </div>
                      ) : null}
                      <div className="trip-list-actions">
                        <Link href={`/trip-details/${trip.id}`} className="btn-brand py-1">Бүртгүүлэх</Link>
                        <Link href={`/trip-details/${trip.id}`} className="btn-brand-outline py-1">Дэлгэрэнгүй</Link>
                        <ContentLikeButton
                          targetType="trip"
                          targetId={trip.id}
                          initialCount={Number((trip as { likeCount?: number }).likeCount ?? 0)}
                          initialLiked={Boolean((trip as { likedByMe?: boolean }).likedByMe)}
                          layout="inline"
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="trip-card-v4">
                <div className="trip-card-body">
                  <h3 className="trip-card-title">Шүүлтүүрт тохирох аялал олдсонгүй</h3>
                  <Link href="/trips" className="btn-brand-outline w-100 text-center py-1 mt-1" style={{ color: "var(--brand-primary)", borderColor: "#bfdbfe" }}>Бүх аялал руу буцах</Link>
                </div>
              </div>
            )}
          </div>

          {/* View All Button */}
          <div className="text-center mb-5 mt-4">
            <Link href="/trips" className="btn-brand-outline px-5" style={{ borderRadius: 20 }}>Бүх аяллыг үзэх <i className="fa-solid fa-arrow-right ms-2" style={{ fontSize: "0.8rem" }}></i></Link>
          </div>
          
          {/* Timeline Section */}
          <div className="timeline-section mt-5">
            <div className="timeline-header">
              <h3 className="widget-title mb-0">Аяллын хөтөлбөр</h3>
              <Link href={featuredTrip ? `/trip-details/${featuredTrip.id}` : '/trips'} className="btn-brand-outline btn-sm d-inline-flex align-items-center text-decoration-none" style={{ fontSize: "0.75rem", padding: "0.3rem 0.8rem", borderColor: "var(--border-color)" }}>Бүрэн хөтөлбөрийг үзэх <i className="fa-solid fa-arrow-right ms-1"></i></Link>
            </div>
            
            <div className="timeline-track">
              <div className="timeline-node is-active" role="button" tabIndex={0}>
                <div className="node-day">Өдөр 1</div>
                <div className="node-circle active"><i className="fa-solid fa-plane-arrival" style={{ fontSize: "1rem" }}></i></div>
                <div className="node-title">Аялал эхлэх</div>
                <div className="node-desc">Нислэг, буудал, зочид буудалд байрлах</div>
              </div>
              <div className="timeline-node" role="button" tabIndex={0}>
                <div className="node-day">Өдөр 2</div>
                <div className="node-circle"><i className="fa-regular fa-handshake" style={{ fontSize: "1rem" }}></i></div>
                <div className="node-title">Бизнес уулзалт</div>
                <div className="node-desc">Төрийн байгууллага, компаниудтай уулзалт</div>
              </div>
              <div className="timeline-node" role="button" tabIndex={0}>
                <div className="node-day">Өдөр 3</div>
                <div className="node-circle"><i className="fa-solid fa-industry" style={{ fontSize: "1rem" }}></i></div>
                <div className="node-title">Үйлдвэр танилцах</div>
                <div className="node-desc">Үйлдвэрийн айлчлал, презентаци</div>
              </div>
              <div className="timeline-node" role="button" tabIndex={0}>
                <div className="node-day">Өдөр 4</div>
                <div className="node-circle"><i className="fa-solid fa-users-viewfinder" style={{ fontSize: "1rem" }}></i></div>
                <div className="node-title">B2B сүлжээ</div>
                <div className="node-desc">Сүлжээ үүсгэх, хамтын ажиллагаа</div>
              </div>
              <div className="timeline-node" role="button" tabIndex={0}>
                <div className="node-day">Өдөр 5</div>
                <div className="node-circle"><i className="fa-solid fa-plane-departure" style={{ fontSize: "1rem" }}></i></div>
                <div className="node-title">Буцах аялал</div>
                <div className="node-desc">Дүгнэлт, чөлөөт цаг, буцах нислэг</div>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="testimonials-section mt-5">
            <h3 className="widget-title mb-4">Оролцогчдын сэтгэгдэл</h3>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="testimonial-card">
                  <div className="testimonial-header">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://ui-avatars.com/api/?name=E&background=random" className="testimonial-avatar" alt="Энхбат" />
                    <div>
                      <div className="testimonial-name">Г. Энхбат</div>
                      <div className="testimonial-role">Гүйцэтгэх захирал, TechBridge LLC</div>
                    </div>
                  </div>
                  <div className="testimonial-stars">
                    <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i> 5.0
                  </div>
                  <div className="testimonial-text">&quot;Шинэ түншүүдтэй холбогдож, бодит төсөл эхлүүлсэн.&quot;</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="testimonial-card">
                  <div className="testimonial-header">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://ui-avatars.com/api/?name=O&background=random" className="testimonial-avatar" alt="Отгонтуяа" />
                    <div>
                      <div className="testimonial-name">Б. Отгонтуяа</div>
                      <div className="testimonial-role">Маркетинг менежер, EcoPack LLC</div>
                    </div>
                  </div>
                  <div className="testimonial-stars">
                    <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star-half-stroke"></i> 4.8
                  </div>
                  <div className="testimonial-text">&quot;Үйлдвэрийн айлчлал маш сонирхолтой, үр өгөөжтэй байлаа.&quot;</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="testimonial-card">
                  <div className="testimonial-header">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://ui-avatars.com/api/?name=M&background=random" className="testimonial-avatar" alt="Мөнх-Эрдэнэ" />
                    <div>
                      <div className="testimonial-name">Ц. Мөнх-Эрдэнэ</div>
                      <div className="testimonial-role">Үйлдвэр эрхлэгч, MonBuild XXK</div>
                    </div>
                  </div>
                  <div className="testimonial-stars">
                    <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i> 4.9
                  </div>
                  <div className="testimonial-text">&quot;Гадаад дэвшилтэт технологитой танилцаж, олон санаа авсан.&quot;</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <aside className="trips-sidebar-right">
          <div className="sidebar-widget">
            <h3 className="widget-title">Яагаад энэ аялал?</h3>
            <div className="reason-item">
              <div className="reason-icon"><i className="fa-solid fa-users-line"></i></div>
              <div className="reason-text">Шинэ түнш, харилцагчтай холбогдох боломж</div>
            </div>
            <div className="reason-item">
              <div className="reason-icon"><i className="fa-solid fa-building-user"></i></div>
              <div className="reason-text">Салбарын тэргүүлэх компаниудтай уулзах</div>
            </div>
            <div className="reason-item">
              <div className="reason-icon"><i className="fa-solid fa-industry"></i></div>
              <div className="reason-text">Үйлдвэр, технологитой танилцах</div>
            </div>
            <div className="reason-item">
              <div className="reason-icon"><i className="fa-regular fa-lightbulb"></i></div>
              <div className="reason-text">Бизнесээ өргөжүүлэх бодит санаа, шийдэл</div>
            </div>
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">Хурдан статистик</h3>
            <div className="stat-row">
              <span style={{ color: "var(--text-muted)" }}>Нийт аялал</span>
              <span style={{ fontWeight: 600 }}>{totalTrips.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span style={{ color: "var(--text-muted)" }}>Ойрын аялал</span>
              <span style={{ fontWeight: 600 }}>{nearTrips.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span style={{ color: "var(--text-muted)" }}>Бүртгүүлсэн гишүүд</span>
              <span style={{ fontWeight: 600 }}>{registeredMembers.toLocaleString()}+</span>
            </div>
            <div className="stat-row">
              <span style={{ color: "var(--text-muted)" }}>Хамгийн өндөр үнэлгээ</span>
              <span style={{ fontWeight: 600 }}>4.9 / 5 <i className="fa-solid fa-star" style={{ color: "#fbbf24", fontSize: "0.75rem" }}></i></span>
            </div>
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">Тусламж хэрэгтэй юу?</h3>
            <p className="help-text">Аяллын талаар асуух зүйл байвал бидэнтэй холбогдоорой.</p>
            <div className="help-contact">
              <i className="fa-solid fa-phone" style={{ color: "var(--brand-primary)", width: 20 }}></i> 7700-0900
            </div>
            <div className="help-contact">
              <i className="fa-regular fa-envelope" style={{ color: "var(--brand-primary)", width: 20 }}></i> travel@busy.mn
            </div>
            <div className="help-contact mb-3">
              <i className="fa-regular fa-clock" style={{ color: "var(--brand-primary)", width: 20 }}></i> Ажиллах цаг: 09:00 - 18:00
            </div>
            <button className="btn-brand-outline w-100">Холбогдох</button>
          </div>
          
          <div className="faq-section mt-4">
            <h3 className="widget-title">Түгээмэл асуултууд</h3>
            <div className="faq-item">
              <div className="faq-question">Аяллын үнэ юунд багтсан бэ? <i className="fa-solid fa-chevron-down"></i></div>
            </div>
            <div className="faq-item">
              <div className="faq-question">Виз мэдүүлэхэд туслах уу? <i className="fa-solid fa-chevron-down"></i></div>
            </div>
            <div className="faq-item">
              <div className="faq-question">Аяллын цуцлалт, буцаалтын нөхцөл? <i className="fa-solid fa-chevron-down"></i></div>
            </div>
            <div className="faq-item">
              <div className="faq-question">Бүртгүүлэх хугацаа хэзээ дуусах вэ? <i className="fa-solid fa-chevron-down"></i></div>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}
