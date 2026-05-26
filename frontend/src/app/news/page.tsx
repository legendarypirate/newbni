import Link from "next/link";
import { createServerT, getServerLang } from "@/lib/i18n/server";
import SafeImage from "@/components/SafeImage";
import { formatMnDate } from "@/lib/format-date";
import { mediaUrl } from "@/lib/media-url";
import {
  loadNewsList,
  newsCategorySlug,
  newsCategoryLabel,
  newsCategoryIcon,
  type NewsArticleRow,
} from "@/lib/news-data";

export const dynamic = "force-dynamic";

const ALLOWED_CATS = ["all", "market", "trip", "guide", "news", "video"] as const;
type CatSlug = (typeof ALLOWED_CATS)[number];

function isCatSlug(value: string): value is CatSlug {
  return (ALLOWED_CATS as readonly string[]).includes(value);
}

/** Approx read-time from article body, with a safe minimum. */
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

type Props = { searchParams: Promise<{ cat?: string }> };

export default async function NewsPage({ searchParams }: Props) {
  const lang = await getServerLang();
  const t = createServerT(lang);
  const sp = await searchParams;
  const catRaw = (sp.cat ?? "all").trim();
  const newsCat: CatSlug = isCatSlug(catRaw) ? catRaw : "all";

  const { rows: allRows } = await loadNewsList({ limit: 50, lang });

  const filtered =
    newsCat === "all"
      ? allRows
      : allRows.filter((r) => newsCategorySlug(r.category) === newsCat);

  const heroArticle =
    allRows.find((r) => r.featured > 0) ||
    allRows.find((r) => newsCategorySlug(r.category) === "market") ||
    allRows[0] ||
    null;

  const cards = filtered
    .filter((r) => r.id !== heroArticle?.id || newsCat !== "all")
    .slice(0, 12);

  const gridClass =
    newsCat === "all"
      ? "n-content-grid n-content-grid--all"
      : `n-content-grid n-content-grid--filter-${newsCat}`;
  const isHeroHidden = newsCat !== "all" && newsCat !== "market";

  return (
    <main className="page-content" style={{ backgroundColor: "var(--bg-page)" }}>
      <div className="container pt-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="fw-bold" style={{ fontSize: "2.25rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>
            {t("news.title")}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
            {t("news.subtitle")}
          </p>
        </div>
      </div>

      <div className="container news-layout">
        {/* Left Sidebar */}
        <aside className="news-sidebar-left">
          <div className="n-widget newsletter-box">
            <h3 className="n-widget-title justify-content-center">Мэдээллийн товхимол</h3>
            <p className="newsletter-desc">Шинэ тайлан, мэдээ, арга хэмжээний мэдээллийг шууд имэйлээр аваарай.</p>
            <form>
              <input type="email" className="newsletter-input" placeholder="Имэйл хаягаа оруулна уу" />
              <button type="button" className="btn-brand w-100 py-2" style={{ fontSize: "0.85rem" }}>
                Бүртгүүлэх
              </button>
            </form>
          </div>

          <div className="n-widget">
            <h3 className="n-widget-title">Ангилал</h3>
            <ul className="saved-topics-list">
              {ALLOWED_CATS.filter((c) => c !== "all").map((slug) => {
                const count = allRows.filter((r) => newsCategorySlug(r.category) === slug).length;
                return (
                  <li key={slug}>
                    <Link
                      href={`/news?cat=${slug}`}
                      className="d-flex justify-content-between align-items-center w-100 text-decoration-none"
                      style={{ color: newsCat === slug ? "var(--brand-primary)" : "inherit" }}
                    >
                      <span className="st-name">
                        <i className={`${newsCategoryIcon(slug)} text-muted`} /> {newsCategoryLabel(slug)}
                      </span>
                      <span className="st-count">{count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/news"
              className="btn btn-light w-100 mt-3 py-1 text-decoration-none"
              style={{ fontSize: "0.8rem", background: "#f8fafc", border: "1px solid var(--border-color)" }}
            >
              Бүгд харах
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="news-main-content">
          {/* Hero Article */}
          {heroArticle ? (
            <Link
              href={`/news/${heroArticle.slug || heroArticle.id}`}
              className={`n-hero-card text-decoration-none${isHeroHidden ? " is-hidden-by-news-cat" : ""}`}
              style={{ color: "inherit" }}
            >
              <div className="n-hero-content">
                <span className="n-hero-tag">{newsCategoryLabel(newsCategorySlug(heroArticle.category))}</span>
                <h2 className="n-hero-title">{heroArticle.title}</h2>
                <p className="n-hero-desc">
                  {stripHtml(heroArticle.excerpt) ||
                    stripHtml(heroArticle.body || heroArticle.content).slice(0, 200) ||
                    "Дэлгэрэнгүй агуулга удахгүй нэмэгдэнэ."}
                </p>
                <div className="n-hero-meta">
                  <span>
                    <i className="fa-regular fa-clock" /> {formatMnDate(heroArticle.createdAt)}
                  </span>
                  <span>
                    <i className="fa-regular fa-bookmark" /> {readMinutes(heroArticle)} мин унших
                  </span>
                </div>
                <div className="n-hero-actions">
                  <span className="btn-brand px-4 py-1" style={{ fontSize: "0.85rem" }}>Унших</span>
                </div>
              </div>
              <div className="n-hero-img-box">
                <SafeImage
                  src={mediaUrl(heroArticle.image) || ""}
                  alt={heroArticle.title}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  fallback={<i className="fa-regular fa-image" />}
                />
              </div>
            </Link>
          ) : null}

          {/* Category Tabs */}
          <div className="n-tabs-scroll">
            <div className="n-tabs" role="tablist">
              <Link href="/news" className={`n-tab${newsCat === "all" ? " active" : ""}`}>
                Бүгд
              </Link>
              {ALLOWED_CATS.filter((c) => c !== "all").map((slug) => (
                <Link
                  key={slug}
                  href={`/news?cat=${slug}`}
                  className={`n-tab${newsCat === slug ? " active" : ""}`}
                >
                  {newsCategoryLabel(slug)}
                </Link>
              ))}
            </div>
          </div>

          {/* Content Grid */}
          {cards.length === 0 ? (
            <div className="n-card text-center py-5" style={{ gridColumn: "1 / -1", color: "var(--text-muted)" }}>
              {allRows.length === 0
                ? "Одоогоор нийтлэгдсэн мэдээ байхгүй байна."
                : "Энэ ангилалд мэдээ олдсонгүй."}
            </div>
          ) : (
            <div className={gridClass}>
              {cards.map((article) => {
                const slug = newsCategorySlug(article.category);
                return (
                  <Link
                    key={article.id}
                    href={`/news/${article.slug || article.id}`}
                    className={`n-card n-card--${slug} text-decoration-none`}
                    style={{ color: "inherit" }}
                  >
                    <div className="n-card-tag">
                      <i className={`${newsCategoryIcon(slug)} me-1`} /> {newsCategoryLabel(slug)}
                    </div>
                    <div className="n-card-icon-box">
                      <SafeImage
                        src={mediaUrl(article.image) || ""}
                        alt={article.title}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                        fallback={<i className={newsCategoryIcon(slug)} />}
                      />
                    </div>
                    <h3 className="n-card-title">{article.title}</h3>
                    <div className="n-card-meta">
                      <span>{formatMnDate(article.createdAt)}</span>
                      <span>
                        <i className="fa-regular fa-clock" /> {readMinutes(article)} мин
                      </span>
                    </div>
                    <div className="n-card-actions">
                      <span className="n-card-btn text-muted">
                        Унших <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.6rem" }} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="news-sidebar-right">
          {/* Most Read — fallback: latest 5 */}
          <div className="n-widget">
            <h3 className="n-widget-title">
              <i className="fa-solid fa-fire text-danger" /> Шинэ мэдээ
            </h3>
            <ul className="trending-list">
              {allRows.slice(0, 5).map((article, idx) => (
                <li key={article.id}>
                  <span className="t-num">{idx + 1}</span>
                  <Link
                    href={`/news/${article.slug || article.id}`}
                    className="t-title text-decoration-none"
                    style={{ color: "inherit" }}
                  >
                    {article.title.length > 56 ? article.title.slice(0, 56) + "..." : article.title}
                  </Link>
                  <span className="t-views">{formatMnDate(article.createdAt).slice(5)}</span>
                </li>
              ))}
              {allRows.length === 0 ? (
                <li className="text-muted small">Мэдээ алга</li>
              ) : null}
            </ul>
            <Link
              href="/news"
              className="btn btn-light w-100 py-1 text-decoration-none"
              style={{ fontSize: "0.8rem", background: "#f8fafc", border: "1px solid var(--border-color)" }}
            >
              Бүгдийг харах
            </Link>
          </div>

          {/* Most Read — featured */}
          <div className="n-widget">
            <h3 className="n-widget-title">
              <i className="fa-solid fa-book-open text-primary" /> Онцлох
            </h3>
            <ul className="most-read-list">
              {allRows
                .filter((r) => r.featured > 0)
                .slice(0, 3)
                .map((article, idx) => {
                  const slug = newsCategorySlug(article.category);
                  return (
                    <li key={article.id}>
                      <div className="mr-img">
                        <span className="mr-num">{idx + 1}</span>
                        <i className={newsCategoryIcon(slug)} />
                      </div>
                      <div className="mr-info">
                        <Link
                          href={`/news/${article.slug || article.id}`}
                          className="mr-title text-decoration-none"
                          style={{ color: "inherit" }}
                        >
                          {article.title.length > 60 ? article.title.slice(0, 60) + "..." : article.title}
                        </Link>
                        <div className="mr-views">
                          <i className="fa-regular fa-clock" /> {formatMnDate(article.createdAt)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              {allRows.filter((r) => r.featured > 0).length === 0 ? (
                <li className="text-muted small">Онцлох нийтлэл алга</li>
              ) : null}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
