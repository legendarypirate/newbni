import type { BniLangCode } from "@/lib/nav-php-parity";
import { apiLangHeaders, withLangQuery } from "@/lib/i18n/server";
import { serverAuthedFetch } from "@/lib/server-authed-fetch";

export type OpportunityType = "investment" | "partnership" | "collaboration" | "other";

export type OpportunityListItem = {
  id: string;
  title: string;
  summary: string;
  opportunityType: OpportunityType | string;
  contextType: string;
  contextId: number | string | null;
  contextLabel: string;
  status: string;
  authorAccountId: string;
  authorName: string;
  createdAt: string;
};

export type OpportunitiesListPayload = {
  schemaReady: boolean;
  opportunities: OpportunityListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  typeFilter: string;
  allowedTypes: string[];
  typeLabels: Record<string, string>;
};

const emptyList: OpportunitiesListPayload = {
  schemaReady: false,
  opportunities: [],
  total: 0,
  page: 1,
  perPage: 12,
  totalPages: 1,
  typeFilter: "all",
  allowedTypes: ["all", "investment", "partnership", "collaboration", "other"],
  typeLabels: {},
};

export async function loadOpportunitiesList(params: {
  type?: string;
  page?: number;
  lang?: BniLangCode;
}): Promise<OpportunitiesListPayload> {
  const lang = params.lang ?? "mn";
  const qs = new URLSearchParams();
  if (params.type && params.type !== "all") qs.set("type", params.type);
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  const suffix = qs.toString() ? `?${qs}` : "";
  const path = withLangQuery(`/api/opportunities${suffix}`, lang);

  try {
    const res = await serverAuthedFetch(path, { headers: apiLangHeaders(lang) });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; data?: OpportunitiesListPayload } | null;
    if (!res.ok || !json?.ok || !json.data) return emptyList;
    return json.data;
  } catch {
    return emptyList;
  }
}

export type OpportunityDetail = OpportunityListItem & {
  body: string | null;
  authorEmail: string;
};

export async function loadOpportunityDetail(
  id: string,
  lang: BniLangCode = "mn",
): Promise<{ opportunity: OpportunityDetail | null; typeLabels: Record<string, string> }> {
  try {
    const path = withLangQuery(`/api/opportunities/${encodeURIComponent(id)}`, lang);
    const res = await serverAuthedFetch(path, { headers: apiLangHeaders(lang) });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      data?: { opportunity: OpportunityDetail; typeLabels: Record<string, string> };
    } | null;
    if (!res.ok || !json?.ok || !json.data?.opportunity) {
      return { opportunity: null, typeLabels: {} };
    }
    return { opportunity: json.data.opportunity, typeLabels: json.data.typeLabels ?? {} };
  } catch {
    return { opportunity: null, typeLabels: {} };
  }
}
