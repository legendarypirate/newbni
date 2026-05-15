import { internalApiUrl } from "@/lib/backend-api";
import type { BniLangCode } from "@/lib/nav-php-parity";
import { apiLangHeaders, withLangQuery } from "@/lib/i18n/server";

/**
 * Public byline data joined from `bni_platform_profiles` (and the underlying
 * `bni_platform_accounts.id`). The backend resolves `news.author_id`
 * → `bni_platform_profiles.account_id` and attaches this object on each
 * article so the UI can render a real name + photo instead of "#1".
 */
export type NewsAuthor = {
  accountId: number;
  displayName: string;
  /** Person portrait from `business_json.member_photo_url`; `photoUrl` is often the company logo. */
  memberPhotoUrl?: string | null;
  photoUrl: string | null;
  companyName: string | null;
  bio: string | null;
};

/**
 * Single news article shape returned by `GET /api/news` and consumed by the
 * `/news` listing + detail pages. Mirrors `news` table columns we read.
 */
export type NewsArticleRow = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  body: string | null;
  image: string | null;
  images: string | null;
  authorId: number;
  status: string;
  featured: number;
  category: number | null;
  type: number | null;
  createDate: string | null;
  createdAt: string;
  updatedAt: string;
  /** Joined byline (display_name, photo_url, company_name) — null when the
   *  article's `author_id` has no matching profile row. */
  author?: NewsAuthor | null;
};

export type NewsListPayload = {
  rows: NewsArticleRow[];
  total: number;
};

const empty: NewsListPayload = { rows: [], total: 0 };

/** Fetches published news from the backend. Returns an empty payload on error
 *  so the page can still render shell UI without throwing. */
export async function loadNewsList(opts?: {
  limit?: number;
  offset?: number;
  /** Platform account id (`news.author_id`) — filters to that author's articles. */
  authorId?: number;
  lang?: BniLangCode;
}): Promise<NewsListPayload> {
  try {
    const limit = Math.max(1, Math.min(100, opts?.limit ?? 24));
    const offset = Math.max(0, opts?.offset ?? 0);
    const params: Record<string, string> = {
      status: "published",
      limit: String(limit),
      offset: String(offset),
    };
    const aid = opts?.authorId;
    if (aid !== undefined && Number.isFinite(aid) && aid > 0) {
      params.authorId = String(Math.floor(aid));
    }
    const lang = opts?.lang ?? "mn";
    const qs = new URLSearchParams(params).toString();
    const url = withLangQuery(internalApiUrl(`/api/news?${qs}`), lang);
    const res = await fetch(url, { cache: "no-store", headers: apiLangHeaders(lang) });
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; data?: { news?: NewsArticleRow[]; total?: number } }
      | null;
    if (!res.ok || !json?.ok || !json.data) return empty;
    const rows = Array.isArray(json.data.news) ? json.data.news : [];
    const total = Number(json.data.total ?? rows.length) || rows.length;
    return { rows, total };
  } catch {
    return empty;
  }
}

/** Fetch a single published article by id-or-slug. Returns `null` on any
 *  failure (404, network, malformed JSON) so the detail page can render a
 *  proper "not found" state without throwing. */
export async function loadNewsArticle(idOrSlug: string, lang: BniLangCode = "mn"): Promise<NewsArticleRow | null> {
  try {
    const safe = encodeURIComponent(idOrSlug);
    const url = withLangQuery(internalApiUrl(`/api/news/${safe}`), lang);
    const res = await fetch(url, { cache: "no-store", headers: apiLangHeaders(lang) });
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; data?: NewsArticleRow }
      | null;
    if (!res.ok || !json?.ok || !json.data) return null;
    return json.data;
  } catch {
    return null;
  }
}

/** Map news article `category` integer to the `/news?cat=…` slug used in
 *  filter tabs. PHP legacy convention: 1=market, 2=trip, 3=guide, 4=news,
 *  5=video. Unknown values fall through to `news`. */
export function newsCategorySlug(category: number | null | undefined): "market" | "trip" | "guide" | "news" | "video" {
  switch (Number(category)) {
    case 1: return "market";
    case 2: return "trip";
    case 3: return "guide";
    case 5: return "video";
    case 4:
    default:
      return "news";
  }
}

const CATEGORY_LABEL: Record<string, string> = {
  market: "Зах зээлийн тайлан",
  trip: "Аяллын тайлан",
  guide: "Гарын авлага",
  news: "Мэдээ",
  video: "Видео",
};

export function newsCategoryLabel(slug: string): string {
  return CATEGORY_LABEL[slug] ?? "Мэдээ";
}

const CATEGORY_ICON: Record<string, string> = {
  market: "fa-solid fa-chart-pie",
  trip: "fa-solid fa-plane",
  guide: "fa-solid fa-book",
  news: "fa-solid fa-bullhorn",
  video: "fa-solid fa-video",
};

export function newsCategoryIcon(slug: string): string {
  return CATEGORY_ICON[slug] ?? "fa-solid fa-newspaper";
}
