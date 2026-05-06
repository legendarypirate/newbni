import { serverAuthedFetch } from "@/lib/server-authed-fetch";

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
type LegacyMember = { id: number; name: string; company: string | null; photo: string | null };
type NewsArticle = { id: number; title: string; image: string | null; createdAt: string };

export type HomePartner = { name: string; logo: string; href: string };

/** Upcoming BNI events for home «Танд санал болгох» (from `bni_events`). */
export type HomeCoreEvent = {
  id: string;
  title: string | null;
  startsAt: string;
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

export async function loadHomeData(): Promise<HomePayload> {
  try {
    const res = await serverAuthedFetch("/home");
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok || !json.data) {
      return empty;
    }
    return json.data;
  } catch (err) {
    console.error("loadHomeData failed:", err);
    return empty;
  }
}
