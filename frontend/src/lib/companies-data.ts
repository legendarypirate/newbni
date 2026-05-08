import { internalApiUrl } from "@/lib/backend-api";

/** Single row from `members` table as returned by `GET /api/members`.
 *  We treat each member as a "company contact" — the `company` field is the
 *  factory / supplier name we surface on the public `/companies` listing. */
export type CompanyMemberRow = {
  id: number;
  name: string;
  position: string | null;
  company: string | null;
  industry: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  linkedin: string | null;
  facebook: string | null;
  photo: string | null;
  featured: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

/** What the `/companies` page actually renders — one card per unique company.
 *  We dedupe member rows by `company` (case-insensitive) and pick the
 *  first/featured contact for the description / industry / contact link. */
export type CompanyCard = {
  /** Stable id (taken from the source member row). */
  id: number;
  /** Company name (always non-empty — rows without a company are dropped). */
  company: string;
  industry: string | null;
  /** Short blurb shown under the company name; falls back to position. */
  blurb: string | null;
  /** Cover image / logo if the source row has a photo. */
  photo: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  /** Mirrors `members.featured` so the UI can highlight verified entries. */
  featured: boolean;
  /** Total number of member rows mapped to this company (useful as a hint). */
  contactCount: number;
};

export type CompaniesListPayload = {
  rows: CompanyCard[];
  total: number;
  /** Featured highlight pulled from the same dataset (first verified row). */
  featured: CompanyCard | null;
};

const empty: CompaniesListPayload = { rows: [], total: 0, featured: null };

/** Fetch real members from the backend and reshape them into company cards.
 *  Returns the empty payload on error so the page can still render shell UI. */
export async function loadCompaniesList(opts?: { q?: string }): Promise<CompaniesListPayload> {
  try {
    const params = new URLSearchParams();
    const q = (opts?.q ?? "").trim();
    if (q) params.set("q", q);
    const qs = params.toString();
    const url = internalApiUrl(`/api/members${qs ? `?${qs}` : ""}`);
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; data?: { members?: CompanyMemberRow[] } }
      | null;
    if (!res.ok || !json?.ok || !json.data) return empty;

    const members = Array.isArray(json.data.members) ? json.data.members : [];
    const byCompany = new Map<string, CompanyCard>();

    for (const m of members) {
      const name = (m.company ?? "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const existing = byCompany.get(key);
      if (existing) {
        existing.contactCount += 1;
        if (!existing.featured && m.featured === 1) {
          existing.featured = true;
        }
        continue;
      }
      byCompany.set(key, {
        id: m.id,
        company: name,
        industry: m.industry?.trim() || null,
        blurb: (m.bio ?? m.position ?? "").trim() || null,
        photo: m.photo?.trim() || null,
        email: m.email?.trim() || null,
        phone: m.phone?.trim() || null,
        website: m.website?.trim() || null,
        featured: m.featured === 1,
        contactCount: 1,
      });
    }

    const rows = Array.from(byCompany.values()).sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.company.localeCompare(b.company, "mn");
    });

    return {
      rows,
      total: rows.length,
      featured: rows.find((r) => r.featured) ?? rows[0] ?? null,
    };
  } catch {
    return empty;
  }
}

/** Tiny icon picker used by the companies cards. Keeps the previously-static
 *  visual variety while staying deterministic (same company → same icon). */
export function companyIconForIndustry(industry: string | null | undefined): string {
  const value = (industry ?? "").toLowerCase();
  if (!value) return "fa-solid fa-industry";
  if (/(textile|нэхмэл|garment|fashion|даавуу)/.test(value)) return "fa-solid fa-leaf";
  if (/(machinery|тоног|механ)/.test(value)) return "fa-solid fa-gears";
  if (/(plastic|хуванцар|polymer)/.test(value)) return "fa-solid fa-box-open";
  if (/(beauty|cosmetic|гоо|арьс)/.test(value)) return "fa-solid fa-spray-can";
  if (/(light|гэрэл|lamp)/.test(value)) return "fa-regular fa-lightbulb";
  if (/(furniture|тавилга|wood)/.test(value)) return "fa-solid fa-chair";
  if (/(electronic|техн|smart|ухаалаг)/.test(value)) return "fa-solid fa-microchip";
  if (/(food|хүнс|drink|ундаа|restaurant)/.test(value)) return "fa-solid fa-utensils";
  if (/(construction|барил|building)/.test(value)) return "fa-solid fa-helmet-safety";
  if (/(finance|санхүү|bank|invest)/.test(value)) return "fa-solid fa-money-bill-wave";
  if (/(logistic|тээвэр|cargo|shipping)/.test(value)) return "fa-solid fa-truck";
  return "fa-solid fa-industry";
}
