import { internalApiUrl } from "@/lib/backend-api";
import type { BniLangCode } from "@/lib/nav-php-parity";
import { apiLangHeaders, withLangQuery } from "@/lib/i18n/server";
import { loadHomeData } from "@/lib/home-data";

/** A fundraising project from `investment_projects` (not business trips). */
export type InvestmentProject = {
  id: number;
  title: string;
  sector: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  targetMnt: number | null;
  raisedPercent: number;
  startDate: string | null;
  statusLabel: string | null;
};

/** Featured member shown on the investors tab. */
export type InvestmentInvestor = {
  id: number;
  name: string;
  company: string | null;
  position: string | null;
  industry: string | null;
  photo: string | null;
  bio: string | null;
};

export type InvestmentsFacet = { value: string; count: number };

export type InvestmentsPayload = {
  projects: InvestmentProject[];
  investors: InvestmentInvestor[];
  featuredProject: InvestmentProject | null;
  facets: {
    projectSectors: InvestmentsFacet[];
    investorIndustries: InvestmentsFacet[];
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

type InvestmentsApiPayload = {
  projects?: InvestmentProject[];
  featuredProject?: InvestmentProject | null;
};

async function loadInvestmentProjects(lang: BniLangCode = "mn"): Promise<{
  projects: InvestmentProject[];
  featuredProject: InvestmentProject | null;
}> {
  try {
    const url = withLangQuery(internalApiUrl("/api/investments"), lang);
    const res = await fetch(url, { cache: "no-store", headers: apiLangHeaders(lang) });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      data?: InvestmentsApiPayload;
    } | null;
    if (!res.ok || !json?.ok || !json.data) {
      return { projects: [], featuredProject: null };
    }
    const projects = Array.isArray(json.data.projects) ? json.data.projects : [];
    return {
      projects,
      featuredProject: json.data.featuredProject ?? projects[0] ?? null,
    };
  } catch {
    return { projects: [], featuredProject: null };
  }
}

export async function loadInvestmentsData(lang: BniLangCode = "mn"): Promise<InvestmentsPayload> {
  try {
    const [{ projects, featuredProject }, home] = await Promise.all([
      loadInvestmentProjects(lang),
      loadHomeData(lang),
    ]);

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
      featuredProject,
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

function countDistinct(values: Array<string | null | undefined>): InvestmentsFacet[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const v = (raw ?? "").trim();
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

const TUGRIK_FORMATTER = new Intl.NumberFormat("mn-MN");

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
