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

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

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

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
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

export default async function MemberPublicPage({ params }: Props) {
  const { id } = await params;
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
  const photoSrc = memberPhotoUrl ? mediaUrl(memberPhotoUrl) : "";
  const industry = str(biz.industry);
  const linkedin = str(biz.linkedin);
  const facebook = str(biz.facebook);

  const newsPayload = await loadNewsList({ authorId: accountId, limit: 48 });

  return (
    <main className="page-content" style={{ backgroundColor: "var(--bg-page)" }}>
      <div className="container py-4">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link href="/">Нүүр</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/members">Гишүүд</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {displayName}
            </li>
          </ol>
        </nav>

        <header className="row g-4 align-items-start mb-5">
          <div className="col-auto">
            <SafeImage
              src={photoSrc}
              alt={displayName}
              width={140}
              height={140}
              className="rounded-3 border shadow-sm"
              style={{ width: 140, height: 140, objectFit: "cover" }}
              fallback={
                <div
                  className="rounded-3 bg-light border d-flex align-items-center justify-content-center text-muted fw-bold fs-2 shadow-sm"
                  style={{ width: 140, height: 140 }}
                >
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              }
            />
          </div>
          <div className="col min-w-0">
            <p className="text-muted small mb-1">Гишүүний профайл</p>
            <h1 className="h2 fw-bold mb-2" style={{ color: "var(--brand-primary)" }}>
              {displayName}
            </h1>
            {profile.companyName?.trim() ? (
              <p className="mb-2 fs-5 text-body-secondary">
                <i className="fa-regular fa-building me-2" aria-hidden />
                {profile.companyName.trim()}
              </p>
            ) : null}
            {industry ? (
              <p className="small text-muted mb-0">
                <i className="fa-solid fa-briefcase me-2" aria-hidden />
                {industry}
              </p>
            ) : null}
          </div>
        </header>

        <div className="row g-4">
          <div className="col-lg-5">
            <section className="card border-0 shadow-sm h-100" aria-labelledby="member-company-heading">
              <div className="card-body">
                <h2 id="member-company-heading" className="h5 card-title">
                  Компани / холбоо барих
                </h2>
                <ul className="list-unstyled small mb-0">
                  {profile.businessEmail?.trim() ? (
                    <li className="mb-2">
                      <i className="fa-regular fa-envelope me-2 text-muted" aria-hidden />
                      <a href={`mailto:${profile.businessEmail.trim()}`}>{profile.businessEmail.trim()}</a>
                    </li>
                  ) : null}
                  {profile.businessPhone?.trim() ? (
                    <li className="mb-2">
                      <i className="fa-solid fa-phone me-2 text-muted" aria-hidden />
                      <a href={`tel:${profile.businessPhone.trim().replace(/\s+/g, "")}`}>
                        {profile.businessPhone.trim()}
                      </a>
                    </li>
                  ) : null}
                  {profile.website?.trim() ? (
                    <li className="mb-2">
                      <i className="fa-solid fa-link me-2 text-muted" aria-hidden />
                      <a href={profile.website.trim()} target="_blank" rel="noopener noreferrer">
                        {profile.website.trim()}
                      </a>
                    </li>
                  ) : null}
                  {profile.addressLine?.trim() ? (
                    <li className="mb-2">
                      <i className="fa-regular fa-map me-2 text-muted" aria-hidden />
                      {profile.addressLine.trim()}
                    </li>
                  ) : null}
                  {linkedin ? (
                    <li className="mb-2">
                      <i className="fa-brands fa-linkedin me-2 text-muted" aria-hidden />
                      <a href={linkedin} target="_blank" rel="noopener noreferrer">
                        LinkedIn
                      </a>
                    </li>
                  ) : null}
                  {facebook ? (
                    <li className="mb-0">
                      <i className="fa-brands fa-facebook me-2 text-muted" aria-hidden />
                      <a href={facebook} target="_blank" rel="noopener noreferrer">
                        Facebook
                      </a>
                    </li>
                  ) : null}
                  {!profile.businessEmail?.trim() &&
                  !profile.businessPhone?.trim() &&
                  !profile.website?.trim() &&
                  !profile.addressLine?.trim() &&
                  !linkedin &&
                  !facebook ? (
                    <li className="text-muted mb-0">Нэмэлт мэдээлэл одоогоор бүртгэгдээгүй байна.</li>
                  ) : null}
                </ul>
              </div>
            </section>
          </div>
          <div className="col-lg-7">
            {profile.bio?.trim() ? (
              <section className="card border-0 shadow-sm mb-4" aria-labelledby="member-bio-heading">
                <div className="card-body">
                  <h2 id="member-bio-heading" className="h5 card-title">
                    Танилцуулга
                  </h2>
                  <div className="small whitespace-pre-wrap">{stripHtml(profile.bio)}</div>
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <section className="mt-5" aria-labelledby="member-news-heading">
          <h2 id="member-news-heading" className="h4 fw-bold mb-3">
            <i className="fa-regular fa-newspaper me-2" aria-hidden />
            Нийтлэл &amp; мэдээ
          </h2>
          {newsPayload.rows.length === 0 ? (
            <p className="text-muted small mb-0">Энэ гишүүний нийтлэл одоогоор байхгүй байна.</p>
          ) : (
            <div className="row g-3">
              {newsPayload.rows.map((row) => {
                const slug = newsCategorySlug(row.category);
                return (
                  <div key={row.id} className="col-md-6 col-xl-4">
                    <Link
                      href={`/news/${row.slug || row.id}`}
                      className="card h-100 border-0 shadow-sm text-reset text-decoration-none news-member-card"
                    >
                      <div className="ratio ratio-16x9 bg-light rounded-top overflow-hidden">
                        <SafeImage
                          src={row.image ? mediaUrl(row.image) : ""}
                          alt={row.title}
                          className="w-100 h-100"
                          style={{ objectFit: "cover" }}
                          fallback={<i className={`${newsCategoryIcon(slug)} text-muted fs-1 m-auto`} aria-hidden />}
                        />
                      </div>
                      <div className="card-body">
                        <span className="badge bg-light text-dark border mb-2">
                          <i className={`${newsCategoryIcon(slug)} me-1`} aria-hidden />
                          {newsCategoryLabel(slug)}
                        </span>
                        <h3 className="h6 card-title mb-2">{row.title}</h3>
                        <p className="small text-muted mb-0">
                          {formatMnDate(row.createdAt)} · {readMinutes(row)} мин
                        </p>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
