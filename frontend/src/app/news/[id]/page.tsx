import Link from "next/link";
import { notFound } from "next/navigation";

import SafeImage from "@/components/SafeImage";
import { formatMnDate } from "@/lib/format-date";
import { mediaUrl } from "@/lib/media-url";
import {
  loadNewsArticle,
  loadNewsList,
  newsCategoryIcon,
  newsCategoryLabel,
  newsCategorySlug,
  type NewsArticleRow,
  type NewsAuthor,
} from "@/lib/news-data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** Approximate read time in minutes. Mirrors `/news/page.tsx` so the meta row
 *  stays consistent between listing and detail. */
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

/** First character of the author's display name (or "?" when unknown).
 *  Used as a circular avatar fallback when the photo URL is missing or 404s. */
function authorInitial(author?: NewsAuthor | null): string {
  const name = author?.displayName?.trim();
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

/** Prefer the member portrait; `photoUrl` can be a company logo in platform profiles. */
function authorPhotoSrc(author?: NewsAuthor | null): string {
  const raw = author?.memberPhotoUrl?.trim() || "";
  return raw ? mediaUrl(raw) : "";
}

/** Display label for the byline. Prefers the joined `display_name`, then the
 *  legacy "#<author_id>" stub, then a generic dash. */
function authorLabel(article: NewsArticleRow): string {
  if (article.author?.displayName?.trim()) return article.author.displayName.trim();
  if (article.authorId) return `Зохиолч #${article.authorId}`;
  return "Тодорхойгүй";
}

/** Public member profile URL (`news.author_id` === platform `account_id`). */
function memberProfileHref(article: NewsArticleRow): string | null {
  const raw = article.author?.accountId ?? article.authorId;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `/member/${n}`;
}

export default async function NewsArticlePage({ params }: Props) {
  const { id } = await params;

  const [article, listing] = await Promise.all([
    loadNewsArticle(id),
    loadNewsList({ limit: 12 }),
  ]);

  if (!article || article.status !== "published") {
    notFound();
  }

  const html = article.content ?? article.body ?? "";
  const catSlug = newsCategorySlug(article.category);
  const catLabel = newsCategoryLabel(catSlug);
  const catIcon = newsCategoryIcon(catSlug);
  const cover = article.image ? mediaUrl(article.image) : null;
  const shareUrl = `https://busy.mn/news/${article.slug || article.id}`;

  // Lists used by sidebar / bottom-of-page sections. Filter out the current
  // article so we don't show it as related to itself.
  const otherArticles = listing.rows.filter((r) => r.id !== article.id);
  const sameCategory = otherArticles
    .filter((r) => newsCategorySlug(r.category) === catSlug)
    .slice(0, 4);
  const latest = otherArticles.slice(0, 5);
  const moreInCategory = otherArticles
    .filter((r) => newsCategorySlug(r.category) === catSlug)
    .slice(0, 6);
  // If there aren't enough in the same category to fill the bottom grid,
  // top it up with the most recent items overall.
  const bottomGridSeen = new Set(moreInCategory.map((r) => r.id));
  const bottomGrid = [
    ...moreInCategory,
    ...otherArticles.filter((r) => !bottomGridSeen.has(r.id)),
  ].slice(0, 3);

  const memberHref = memberProfileHref(article);

  return (
    <main className="page-content" style={{ backgroundColor: "var(--bg-page)" }}>
      <div className="container py-4">
        {/* Top toolbar */}
        <div className="nd-toolbar">
          <Link href="/news" className="nd-back">
            <i className="fa-solid fa-arrow-left" /> Бүх мэдээ рүү буцах
          </Link>
        </div>

        {/* Hero ─────────────────────────────────────────── */}
        <header className={`nd-hero${cover ? "" : " nd-hero--no-image"}`}>
          {cover ? (
            <div className="nd-hero-img">
              <SafeImage
                src={cover}
                alt={article.title}
                fallback={
                  <div className="nd-hero-fallback-icon" aria-hidden="true">
                    <i className={catIcon} />
                  </div>
                }
              />
            </div>
          ) : (
            <div className="nd-hero-fallback-icon" aria-hidden="true">
              <i className={catIcon} />
            </div>
          )}
          <div className="nd-hero-overlay" />

          <div className="nd-hero-content">
            <nav className="nd-crumbs" aria-label="Breadcrumb">
              <Link href="/">Нүүр</Link>
              <span className="sep">›</span>
              <Link href="/news">Мэдээ</Link>
              <span className="sep">›</span>
              <Link href={`/news?cat=${catSlug}`}>{catLabel}</Link>
              <span className="sep">›</span>
              <span className="current">{article.title}</span>
            </nav>

            <div className="nd-hero-tags">
              <span className="nd-tag">
                <i className={catIcon} /> {catLabel}
              </span>
              {article.featured > 0 ? (
                <span className="nd-tag is-featured">
                  <i className="fa-solid fa-star" /> Онцлох
                </span>
              ) : null}
            </div>

            <h1 className="nd-hero-title">{article.title}</h1>

            {article.excerpt ? (
              <p className="nd-hero-excerpt">{stripHtml(article.excerpt)}</p>
            ) : null}

            <div className="nd-hero-meta">
              {memberHref ? (
                <Link
                  href={memberHref}
                  className="nd-byline nd-byline--link text-reset text-decoration-none"
                  prefetch={false}
                >
                  <span className="nd-avatar" aria-hidden="true">
                    <SafeImage
                      src={authorPhotoSrc(article.author)}
                      alt={article.author?.displayName || "Зохиолч"}
                      fallback={
                        article.author?.displayName ? (
                          <span className="nd-avatar-initial">{authorInitial(article.author)}</span>
                        ) : (
                          <i className="fa-solid fa-user" />
                        )
                      }
                    />
                  </span>
                  <span className="nd-byline-text">
                    <span className="nd-byline-name">{authorLabel(article)}</span>
                    {article.author?.companyName ? (
                      <span className="nd-byline-company">{article.author.companyName}</span>
                    ) : null}
                  </span>
                </Link>
              ) : (
                <span className="nd-byline">
                  <span className="nd-avatar" aria-hidden="true">
                    <SafeImage
                      src={authorPhotoSrc(article.author)}
                      alt={article.author?.displayName || "Зохиолч"}
                      fallback={
                        article.author?.displayName ? (
                          <span className="nd-avatar-initial">{authorInitial(article.author)}</span>
                        ) : (
                          <i className="fa-solid fa-user" />
                        )
                      }
                    />
                  </span>
                  <span className="nd-byline-text">
                    <span className="nd-byline-name">{authorLabel(article)}</span>
                    {article.author?.companyName ? (
                      <span className="nd-byline-company">{article.author.companyName}</span>
                    ) : null}
                  </span>
                </span>
              )}
              <span className="nd-hero-meta-sep" aria-hidden="true" />
              <span className="nd-hero-meta-item">
                <i className="fa-regular fa-calendar" />
                {formatMnDate(article.createdAt)}
              </span>
              <span className="nd-hero-meta-sep" aria-hidden="true" />
              <span className="nd-hero-meta-item">
                <i className="fa-regular fa-clock" />
                {readMinutes(article)} мин унших
              </span>
            </div>
          </div>
        </header>

        {/* Article body + sticky sidebar ────────────────── */}
        <div className="news-detail-layout">
          <article className="nd-article">
            {article.excerpt ? (
              <p className="nd-lede">{stripHtml(article.excerpt)}</p>
            ) : null}

            <div className="nd-actions-row">
              <div className="nd-stats">
                <span>
                  <i className="fa-regular fa-calendar" />
                  {formatMnDate(article.createdAt)}
                </span>
                <span>
                  <i className="fa-regular fa-clock" />
                  {readMinutes(article)} мин
                </span>
              </div>
              <div className="nd-stats">
                <span>
                  <i className={catIcon} /> {catLabel}
                </span>
              </div>
            </div>

            {html ? (
              <div
                className="prose-busy has-dropcap"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <p className="text-muted">Энэ нийтлэлд агуулга бичигдээгүй байна.</p>
            )}

            {article.author ? (
              memberHref ? (
                <Link
                  href={memberHref}
                  prefetch={false}
                  className="nd-author-card nd-author-card--link text-reset text-decoration-none"
                  aria-label="Зохиогчийн тухай — профайл руу очих"
                >
                  <div className="nd-author-card-avatar">
                    <SafeImage
                      src={authorPhotoSrc(article.author)}
                      alt={article.author.displayName}
                      fallback={
                        <span className="nd-author-card-initial">
                          {authorInitial(article.author)}
                        </span>
                      }
                    />
                  </div>
                  <div className="nd-author-card-body">
                    <div className="nd-author-card-eyebrow">Зохиогчийн тухай</div>
                    <h3 className="nd-author-card-name">{article.author.displayName}</h3>
                    {article.author.companyName ? (
                      <div className="nd-author-card-company">
                        <i className="fa-regular fa-building" />
                        {article.author.companyName}
                      </div>
                    ) : null}
                    {article.author.bio ? (
                      <p className="nd-author-card-bio">
                        {stripHtml(article.author.bio).slice(0, 280)}
                        {stripHtml(article.author.bio).length > 280 ? "…" : ""}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ) : (
                <aside className="nd-author-card" aria-label="Зохиогчийн тухай">
                  <div className="nd-author-card-avatar">
                    <SafeImage
                      src={authorPhotoSrc(article.author)}
                      alt={article.author.displayName}
                      fallback={
                        <span className="nd-author-card-initial">
                          {authorInitial(article.author)}
                        </span>
                      }
                    />
                  </div>
                  <div className="nd-author-card-body">
                    <div className="nd-author-card-eyebrow">Зохиогчийн тухай</div>
                    <h3 className="nd-author-card-name">{article.author.displayName}</h3>
                    {article.author.companyName ? (
                      <div className="nd-author-card-company">
                        <i className="fa-regular fa-building" />
                        {article.author.companyName}
                      </div>
                    ) : null}
                    {article.author.bio ? (
                      <p className="nd-author-card-bio">
                        {stripHtml(article.author.bio).slice(0, 280)}
                        {stripHtml(article.author.bio).length > 280 ? "…" : ""}
                      </p>
                    ) : null}
                  </div>
                </aside>
              )
            ) : null}

            <div className="nd-share">
              <span className="nd-share-label">
                <i className="fa-solid fa-share-nodes me-2" /> Хуваалцах
              </span>
              <a
                className="nd-share-btn"
                data-net="facebook"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <i className="fa-brands fa-facebook-f" />
              </a>
              <a
                className="nd-share-btn"
                data-net="twitter"
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <i className="fa-brands fa-x-twitter" />
              </a>
              <a
                className="nd-share-btn"
                data-net="linkedin"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <i className="fa-brands fa-linkedin-in" />
              </a>
              <a
                className="nd-share-btn"
                data-net="email"
                href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(shareUrl)}`}
                aria-label="Email"
              >
                <i className="fa-regular fa-envelope" />
              </a>
            </div>
          </article>

          <aside className="nd-sidebar">
            {sameCategory.length > 0 ? (
              <div className="n-widget">
                <h3 className="n-widget-title">
                  <i className={catIcon} /> Холбогдох
                </h3>
                {sameCategory.map((r) => (
                  <Link
                    key={r.id}
                    href={`/news/${r.slug || r.id}`}
                    className="nd-related-item"
                  >
                    <div className="nd-related-thumb">
                      <SafeImage
                        src={mediaUrl(r.image) || ""}
                        alt={r.title}
                        loading="lazy"
                        fallback={<i className={newsCategoryIcon(newsCategorySlug(r.category))} />}
                      />
                    </div>
                    <div className="nd-related-info">
                      <div className="nd-related-title">{r.title}</div>
                      <div className="nd-related-meta">
                        {formatMnDate(r.createdAt)} · {readMinutes(r)} мин
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="n-widget">
              <h3 className="n-widget-title">
                <i className="fa-solid fa-fire text-danger" /> Шинэ мэдээ
              </h3>
              {latest.length === 0 ? (
                <p className="text-muted small mb-0">Өөр мэдээ алга.</p>
              ) : (
                latest.map((r) => (
                  <Link
                    key={r.id}
                    href={`/news/${r.slug || r.id}`}
                    className="nd-related-item"
                  >
                    <div className="nd-related-thumb">
                      <SafeImage
                        src={mediaUrl(r.image) || ""}
                        alt={r.title}
                        loading="lazy"
                        fallback={<i className={newsCategoryIcon(newsCategorySlug(r.category))} />}
                      />
                    </div>
                    <div className="nd-related-info">
                      <div className="nd-related-title">{r.title}</div>
                      <div className="nd-related-meta">
                        {stripHtml(r.excerpt).slice(0, 60) || formatMnDate(r.createdAt)}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="n-widget nd-newsletter">
              <h3 className="n-widget-title">
                <i className="fa-regular fa-envelope-open" /> Мэдээллийн товхимол
              </h3>
              <p>Шинэ тайлан, мэдээ, арга хэмжээний мэдээллийг шууд имэйлээр аваарай.</p>
              <form>
                <input type="email" placeholder="Имэйл хаягаа оруулна уу" />
                <button type="button">Бүртгүүлэх</button>
              </form>
            </div>
          </aside>
        </div>

        {/* Bottom: more articles in this category ────────── */}
        {bottomGrid.length > 0 ? (
          <section className="nd-more-section">
            <div className="nd-more-header">
              <h2 className="nd-more-title">
                <i className={catIcon} /> {catLabel} — өөр нийтлэлүүд
              </h2>
              <Link href={`/news?cat=${catSlug}`} className="nd-more-link">
                Бүгдийг харах <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.7rem" }} />
              </Link>
            </div>

            <div className="nd-more-grid">
              {bottomGrid.map((r) => {
                const slug = newsCategorySlug(r.category);
                return (
                  <Link
                    key={r.id}
                    href={`/news/${r.slug || r.id}`}
                    className="nd-more-card"
                  >
                    <div className="nd-more-card-thumb">
                      <SafeImage
                        src={mediaUrl(r.image) || ""}
                        alt={r.title}
                        loading="lazy"
                        fallback={<i className={newsCategoryIcon(slug)} />}
                      />
                    </div>
                    <div className="nd-more-card-body">
                      <span className="nd-more-card-tag">
                        <i className={`${newsCategoryIcon(slug)} me-1`} /> {newsCategoryLabel(slug)}
                      </span>
                      <h3 className="nd-more-card-title">{r.title}</h3>
                      <div className="nd-more-card-meta">
                        <span>{formatMnDate(r.createdAt)}</span>
                        <span>
                          <i className="fa-regular fa-clock" /> {readMinutes(r)} мин
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
