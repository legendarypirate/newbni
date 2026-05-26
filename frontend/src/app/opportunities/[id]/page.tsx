import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerT, getServerLang } from "@/lib/i18n/server";
import { loadOpportunityDetail } from "@/lib/opportunities-data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OpportunityDetailPage({ params }: Props) {
  const lang = await getServerLang();
  const t = createServerT(lang);
  const { id } = await params;
  const { opportunity: opp, typeLabels } = await loadOpportunityDetail(id, lang);

  if (!opp) {
    notFound();
  }

  const isOpen = opp.status === "open";

  return (
    <main className="page-content" style={{ backgroundColor: "var(--bg-page)" }}>
      <section className="py-5">
        <div className="container" style={{ maxWidth: 800 }}>
          <nav className="mb-3">
            <Link href="/opportunities" className="small text-decoration-none">
              ← {t("opportunities.backAll")}
            </Link>
          </nav>

          <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
            <span className="badge bg-primary">
              {typeLabels[opp.opportunityType] ?? opp.opportunityType}
            </span>
            <span className={`badge ${isOpen ? "bg-success" : "bg-secondary"}`}>
              {isOpen ? t("opportunities.statusOpen") : t("opportunities.statusClosed")}
            </span>
          </div>

          <h1 className="h3 fw-bold mb-2">{opp.title}</h1>
          <p className="text-muted small mb-3">
            {t("opportunities.postedBy")}:{" "}
            <Link href={`/member/${opp.authorAccountId}`} className="text-decoration-none">
              {opp.authorName || t("opportunities.memberFallback")}
            </Link>
            · {opp.createdAt.slice(0, 16).replace("T", " ")}
          </p>

          {opp.contextLabel ? (
            <div className="alert alert-light border mb-3">
              <i className="fas fa-anchor me-2 text-primary" aria-hidden />
              {opp.contextLabel}
            </div>
          ) : null}

          <div className="busy-card bg-white p-4 rounded-4 shadow-sm mb-4">
            <h2 className="h6 fw-bold text-uppercase text-muted mb-2">{t("opportunities.summary")}</h2>
            <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
              {opp.summary}
            </p>
          </div>

          {opp.body ? (
            <div className="busy-card bg-white p-4 rounded-4 shadow-sm mb-4">
              <h2 className="h6 fw-bold text-uppercase text-muted mb-2">{t("opportunities.body")}</h2>
              <div style={{ whiteSpace: "pre-wrap" }}>{opp.body}</div>
            </div>
          ) : null}

          {isOpen ? (
            <div className="alert alert-warning">
              {t("opportunities.loginToApply")}{" "}
              <Link href={`/auth/login?next=${encodeURIComponent(`/opportunities/${id}`)}`}>
                {t("auth.login")}
              </Link>
              .
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
