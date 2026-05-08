import { loadHomeData } from "@/lib/home-data";

/** A real "investment project" derived from a `business_trips` row. Trips are
 *  the closest existing concept to a fundraising project in the current DB
 *  (each has a description, an organizer, a price, and progress over time). */
export type InvestmentProject = {
  id: number;
  title: string;
  sector: string | null;
  /** Plain-text excerpt of the trip description (HTML stripped, clipped). */
  excerpt: string | null;
  /** Cover image, if the trip has one. */
  coverImageUrl: string | null;
  /** Funding target derived from `priceMnt` (₮). May be null. */
  targetMnt: number | null;
  /** Synthetic "raised %" computed from trip progress so progress bars have
   *  something to show until a real funding model exists. Always 0–100. */
  raisedPercent: number;
  /** ISO start date so the UI can show recency / status. */
  startDate: string | null;
  /** Optional status label from the trip ("Бүртгэл нээлттэй" etc.). */
  statusLabel: string | null;
};

/** A real "investor" derived from a featured `members` row — these are the
 *  curated public contacts shown on the home page. */
export type InvestmentInvestor = {
  id: number;
  name: string;
  company: string | null;
  position: string | null;
  industry: string | null;
  photo: string | null;
  bio: string | null;
};

/** Distinct values used to drive the left-sidebar filter menus. Each item
 *  carries its own count so the UI can render badges like "Fintech (4)". */
export type InvestmentsFacet = { value: string; count: number };

export type InvestmentsPayload = {
  projects: InvestmentProject[];
  investors: InvestmentInvestor[];
  /** Top project (used as the "featured project" hero card). */
  featuredProject: InvestmentProject | null;
  facets: {
    /** Distinct project sectors / status labels — drives the "Салбар" list
     *  on the projects tab. Sourced from `business_trips.statusLabel`. */
    projectSectors: InvestmentsFacet[];
    /** Distinct investor industries — drives the "Салбар" list on the
     *  investors tab. Sourced from `members.industry`. */
    investorIndustries: InvestmentsFacet[];
    /** Distinct investor positions — drives the "Багц / албан тушаал"
     *  list. Sourced from `members.position`. */
    investorPositions: InvestmentsFacet[];
  };
};

const empty: InvestmentsPayload = {
  projects: [],
  investors: [],
  featuredProject: null,
  facets: {
    projectSectors: [],
    investorIndustries: [],
    investorPositions: [],
  },
};

function stripHtml(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const text = raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

/** Map a trip's `startDate` to a synthetic completion percent so progress bars
 *  aren't all 0%. Trips far in the future show low %, trips starting soon /
 *  ongoing show high %. Range is clamped to 5–95 to avoid ugly extremes. */
function progressFromStart(startDateIso: string | null): number {
  if (!startDateIso) return 30;
  const start = new Date(startDateIso).getTime();
  if (Number.isNaN(start)) return 30;
  const now = Date.now();
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const monthsAway = (start - now) / monthMs;
  if (monthsAway <= 0) return 90;
  if (monthsAway >= 6) return 15;
  const pct = Math.round(95 - (monthsAway / 6) * 80);
  return Math.min(95, Math.max(5, pct));
}

export async function loadInvestmentsData(): Promise<InvestmentsPayload> {
  try {
    const home = await loadHomeData();

    const projects: InvestmentProject[] = (home.businessTrips ?? []).map((t) => {
      const startIso = t.startDate ? new Date(t.startDate).toISOString() : null;
      return {
        id: t.id,
        title: t.destination,
        sector: t.statusLabel ?? null,
        excerpt: stripHtml(t.description)?.slice(0, 220) ?? null,
        coverImageUrl: t.coverImageUrl ?? null,
        targetMnt: t.priceMnt != null ? Number(t.priceMnt) : null,
        raisedPercent: progressFromStart(startIso),
        startDate: startIso,
        statusLabel: t.statusLabel ?? null,
      };
    });

    const investors: InvestmentInvestor[] = (home.featuredMembers ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      company: m.company ?? null,
      position: m.position ?? null,
      industry: m.industry ?? null,
      photo: m.photo ?? null,
      bio: m.bio ?? null,
    }));

    return {
      projects,
      investors,
      featuredProject: projects[0] ?? null,
      facets: {
        projectSectors: countDistinct(projects.map((p) => p.sector)),
        investorIndustries: countDistinct(investors.map((i) => i.industry)),
        investorPositions: countDistinct(investors.map((i) => i.position)),
      },
    };
  } catch {
    return empty;
  }
}

/** Build a `[{ value, count }]` array from a list of nullable strings, sorted
 *  by descending frequency then alphabetically. Empty / whitespace strings
 *  are dropped so they never become "ghost" filter entries. */
function countDistinct(values: Array<string | null | undefined>): InvestmentsFacet[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const v = (raw ?? "").trim();
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => (b.count - a.count) || a.value.localeCompare(b.value));
}

const TUGRIK_FORMATTER = new Intl.NumberFormat("mn-MN");

/** Format ₮ amounts roughly the way the static UI did ("₮1.2 тэрбум" etc.). */
export function formatMntCompact(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return "—";
  if (amount >= 1_000_000_000) {
    return `₮${(amount / 1_000_000_000).toFixed(1)} тэрбум`;
  }
  if (amount >= 1_000_000) {
    return `₮${(amount / 1_000_000).toFixed(0)} сая`;
  }
  return `₮${TUGRIK_FORMATTER.format(amount)}`;
}

export function projectIconForSector(label: string | null | undefined): string {
  const value = (label ?? "").toLowerCase();
  if (!value) return "fa-solid fa-rocket";
  if (/(eco|green|cleantech|байгал|ногоон|эрчим)/.test(value)) return "fa-solid fa-seedling";
  if (/(edu|сургалт|сургууль)/.test(value)) return "fa-solid fa-graduation-cap";
  if (/(fin|finance|санхүү|төлбөр|төлөл)/.test(value)) return "fa-solid fa-money-bill-transfer";
  if (/(food|хүнс|restaurant|рестораны)/.test(value)) return "fa-solid fa-utensils";
  if (/(travel|trip|аялал|тур)/.test(value)) return "fa-solid fa-plane";
  if (/(tech|саас|saas|ai|ухаалаг)/.test(value)) return "fa-solid fa-microchip";
  return "fa-solid fa-rocket";
}
