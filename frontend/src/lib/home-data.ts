import { internalApiUrl } from "@/lib/backend-api";
import type { BniLangCode } from "@/lib/nav-php-parity";
import { apiLangHeaders, withLangQuery } from "@/lib/i18n/server";

type RecentOrderRow = { orderRef: string; createdAt: string };
type BusinessTrip = {
  id: number;
  destination: string;
  startDate: string;
  endDate: string;
  coverImageUrl: string | null;
  description: string | null;
  statusLabel: string | null;
  priceMnt: number | null;
};
type LegacyMember = {
  id: number;
  name: string;
  company: string | null;
  photo: string | null;
  /** Optional fields populated when the home endpoint returns full member rows
   *  (e.g. for `loadInvestmentsData` to derive industry/position facets). */
  position?: string | null;
  industry?: string | null;
  bio?: string | null;
};
type NewsArticle = {
  id: number;
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  content?: string | null;
  body?: string | null;
  image: string | null;
  createdAt: string;
};

export type HomePartner = { name: string; logo: string; href: string };

/** Upcoming BNI events for home «Танд санал болгох» (from `bni_events`). */
export type HomeCoreEvent = {
  id: string;
  title: string | null;
  startsAt: string;
  endsAt?: string | null;
  location: string | null;
  bannerImage: string | null;
};

export type HomePayload = {
  stats: {
    tripTotal: number;
    tripActive: number;
    eventTotal: number;
    eventActive: number;
    registrationTotal: number;
    registrationNew: number;
    revenueMonth: number;
  };
  /** Prefer concrete Prisma models — `Awaited<ReturnType<typeof prisma.*.findMany>>` can degrade to `any[]` in some setups. */
  heroTrip: BusinessTrip | null;
  coreEvents: HomeCoreEvent[];
  businessTrips: BusinessTrip[];
  latestNews: NewsArticle[];
  featuredMembers: LegacyMember[];
  partners: HomePartner[];
  recentOrders: RecentOrderRow[];
};

const empty: HomePayload = {
  stats: {
    tripTotal: 0,
    tripActive: 0,
    eventTotal: 0,
    eventActive: 0,
    registrationTotal: 0,
    registrationNew: 0,
    revenueMonth: 0,
  },
  heroTrip: null,
  coreEvents: [],
  businessTrips: [],
  latestNews: [],
  featuredMembers: [],
  partners: [],
  recentOrders: [],
};

export async function loadHomeData(lang: BniLangCode = "mn"): Promise<HomePayload> {
  try {
    const url = withLangQuery(internalApiUrl("/api/home"), lang);
    const res = await fetch(url, { cache: "no-store", headers: apiLangHeaders(lang) });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; data?: HomePayload } | null;
    if (!res.ok || !json?.ok || !json.data) {
      return empty;
    }
    return json.data;
  } catch {
    return empty;
  }
}
