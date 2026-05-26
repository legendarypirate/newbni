import type { BniLangCode } from "@/lib/nav-php-parity";
import { apiLangHeaders, withLangQuery } from "@/lib/i18n/server";
import { serverAuthedFetch } from "@/lib/server-authed-fetch";

type RecentOrderRow = { orderRef: string; createdAt: string };
type LikeMeta = {
  likeCount?: number;
  likedByMe?: boolean;
};

type BusinessTrip = {
  id: number;
  destination: string;
  startDate: string;
  endDate: string;
  coverImageUrl: string | null;
  description: string | null;
  statusLabel: string | null;
  priceMnt: number | null;
} & LikeMeta;
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
} & LikeMeta;

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

type TripsListPayload = {
  trips?: BusinessTrip[];
  totalTrips?: number;
  nearTrips?: number;
  registeredMembers?: number;
};

/** When `/api/home` fails, reuse the same public trips feed as `/trips`. */
async function loadHomeTripsFallback(lang: BniLangCode): Promise<HomePayload | null> {
  try {
    const path = withLangQuery("/platform/trips?trip_type=all", lang);
    const res = await serverAuthedFetch(path, { headers: apiLangHeaders(lang) });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      data?: TripsListPayload;
    } | null;
    if (!res.ok || !json?.ok || !json.data?.trips) {
      return null;
    }
    const trips = json.data.trips.slice(0, 3);
    return {
      ...empty,
      stats: {
        ...empty.stats,
        tripTotal: json.data.totalTrips ?? trips.length,
        tripActive: json.data.nearTrips ?? trips.length,
        registrationTotal: json.data.registeredMembers ?? 0,
      },
      heroTrip: trips[0] ?? null,
      businessTrips: trips,
    };
  } catch {
    return null;
  }
}

export async function loadHomeData(lang: BniLangCode = "mn"): Promise<HomePayload> {
  try {
    const path = withLangQuery("/home", lang);
    const res = await serverAuthedFetch(path, { headers: apiLangHeaders(lang) });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; data?: HomePayload } | null;
    if (res.ok && json?.ok && json.data) {
      return json.data;
    }
  } catch {
    // fall through to trips list
  }

  const fallback = await loadHomeTripsFallback(lang);
  return fallback ?? empty;
}
