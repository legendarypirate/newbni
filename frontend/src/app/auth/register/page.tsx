import Link from "next/link";
import type { Metadata } from "next";
import { createServerT, getServerLang } from "@/lib/i18n/server";
import RegisterForm from "./RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const t = createServerT(lang);
  return {
    title: `${t("auth.registerTitle")} | BUSY.mn`,
    description: t("auth.registerMetaDesc"),
  };
}

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstString(v: string | string[] | undefined): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
}

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const lang = await getServerLang();
  const t = createServerT(lang);
  const sp = await searchParams;
  const rawNext = firstString(sp.next);
  const nextPath =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext.slice(0, 512) : "/";

  const nextGoogleReady =
    Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) && Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());
  const dbReady = Boolean(process.env.DATABASE_URL?.trim());

  const nextGoogleHref =
    nextGoogleReady && dbReady
      ? `/api/auth/google${nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`
      : null;
  const legacyRaw = process.env.NEXT_PUBLIC_LEGACY_SITE_URL?.trim() ?? "";
  const legacyBase = legacyRaw ? legacyRaw.replace(/\/$/, "") : null;
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ?? "";
  const legacyGoogleHref =
    legacyBase && nextPath !== "/" && appOrigin
      ? `${legacyBase}/auth/google-start.php?next=${encodeURIComponent(`${appOrigin}${nextPath}`)}`
      : legacyBase
        ? `${legacyBase}/auth/google-start.php`
        : null;
  const googleHref = nextGoogleHref ?? legacyGoogleHref;

  return (
    <section className="bni-auth-shell bni-auth-shell--register">
      <div className="container">
        <div className="bni-auth-card bni-auth-card--register">
          <div className="bni-auth-card-accent" aria-hidden="true" />
          <div className="bni-auth-card-inner">
            <div className="text-center bni-auth-register-head">
              <div className="bni-auth-icon-wrap" aria-hidden="true">
                <i className="fa-solid fa-user-plus" />
              </div>
              <h1 className="bni-auth-title">{t("auth.registerTitle")}</h1>
              <p className="bni-auth-lead text-muted mb-0">{t("auth.registerLead")}</p>
            </div>

            <RegisterForm
              nextPath={nextPath}
              googleHref={googleHref}
              googleUsesNextPlatformOAuth={Boolean(nextGoogleHref?.startsWith("/api"))}
            />

            <p className="bni-auth-register-vision small text-muted text-center mb-0 px-1">
              {t("vision.goal")}
            </p>

            <div className="text-center bni-auth-register-back">
              <Link href="/" className="small text-decoration-none text-muted">
                <i className="fas fa-arrow-left me-1" aria-hidden="true" />
                {t("auth.backHome")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
