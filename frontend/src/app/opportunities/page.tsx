import Link from "next/link";
import { cookies } from "next/headers";
import { createServerT, getServerLang } from "@/lib/i18n/server";
import { readBniTokenFromCookieHeader } from "@/lib/auth-cookie-token";
import { loadOpportunitiesList } from "@/lib/opportunities-data";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["all", "investment", "partnership", "collaboration", "other"] as const;

type SearchParams = Promise<{ type?: string; page?: string }>;

function isAllowedType(value: string): value is (typeof ALLOWED_TYPES)[number] {
  return (ALLOWED_TYPES as readonly string[]).includes(value);
}

export default async function OpportunitiesPage({ searchParams }: { searchParams: SearchParams }) {
  const lang = await getServerLang();
  const t = createServerT(lang);
  const sp = await searchParams;
  const typeRaw = (sp.type ?? "all").trim().toLowerCase();
  const typeFilter = isAllowedType(typeRaw) ? typeRaw : "all";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const jar = await cookies();
  const cookieHeader = jar
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const isLoggedIn = Boolean(
    readBniTokenFromCookieHeader(cookieHeader) ||
      jar.get("bni_platform_account_id")?.value ||
      jar.get("bni_platform_account_ref")?.value,
  );

  const data = await loadOpportunitiesList({ type: typeFilter, page, lang });
  const typeLabels = { ...data.typeLabels };

  function typeHref(code: string, pageNum = 1) {
    const qs = new URLSearchParams();
    if (code !== "all") qs.set("type", code);
    if (pageNum > 1) qs.set("page", String(pageNum));
    const q = qs.toString();
    return q ? `/opportunities?${q}` : "/opportunities";
  }

  return (
    <main className="page-content" style={{ backgroundColor: "var(--bg-page)" }}>
      <section className="py-5">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
            <div>
              <h1 className="h3 fw-bold text-dark mb-1">{t("opportunities.title")}</h1>
              <p className="text-muted small mb-0">{t("opportunities.lead")}</p>
            </div>
            {isLoggedIn ? (
              <Link href="/platform/opportunities" className="btn btn-primary btn-sm fw-bold">
                <i className="fas fa-plus me-1" aria-hidden />
                {t("opportunities.newPost")}
              </Link>
            ) : null}
          </div>

          {!data.schemaReady ? (
            <div className="alert alert-warning">
              {t("opportunities.schemaMissing")}
            </div>
          ) : (
            <>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {ALLOWED_TYPES.map((code) => (
                  <Link
                    key={code}
                    href={typeHref(code)}
                    className={`btn btn-sm ${typeFilter === code ? "btn-primary" : "btn-outline-secondary"}`}
                  >
                    {code === "all" ? t("common.all") : typeLabels[code] ?? code}
                  </Link>
                ))}
              </div>

              <div className="row g-4">
                {data.opportunities.map((o) => (
                  <div className="col-md-6 col-lg-4" key={o.id}>
                    <div className="busy-card bg-white h-100 border-0 shadow-sm rounded-4 p-4 position-relative">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge bg-light text-dark border">
                          {typeLabels[o.opportunityType] ?? o.opportunityType}
                        </span>
                        <small className="text-muted">{o.createdAt.slice(0, 10)}</small>
                      </div>
                      <h2 className="h6 fw-bold mb-2">
                        <Link href={`/opportunities/${o.id}`} className="text-dark text-decoration-none">
                          {o.title}
                        </Link>
                      </h2>
                      <p className="small text-muted mb-2" style={{ lineHeight: 1.5 }}>
                        {o.summary.length > 160 ? `${o.summary.slice(0, 160)}…` : o.summary}
                      </p>
                      {o.contextLabel ? (
                        <p className="small mb-2">
                          <i className="fas fa-link text-primary me-1" aria-hidden />
                          {o.contextLabel}
                        </p>
                      ) : null}
                      <div className="small text-muted">
                        <Link
                          href={`/member/${o.authorAccountId}`}
                          className="text-muted text-decoration-none"
                        >
                          {o.authorName || t("opportunities.memberFallback")}
                        </Link>
                      </div>
                      <Link
                        href={`/opportunities/${o.id}`}
                        className="stretched-link"
                        aria-label={t("opportunities.ariaDetail")}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {data.opportunities.length === 0 ? (
                <div className="text-center text-muted py-5">{t("opportunities.empty")}</div>
              ) : null}

              {data.totalPages > 1 ? (
                <nav className="mt-4" aria-label="Pagination">
                  <ul className="pagination justify-content-center flex-wrap mb-0">
                    {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((n) => (
                      <li key={n} className={`page-item${n === page ? " active" : ""}`}>
                        <Link className="page-link" href={typeHref(typeFilter, n)}>
                          {n}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
