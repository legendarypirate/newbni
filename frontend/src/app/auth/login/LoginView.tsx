import Link from "next/link";
import { cookies } from "next/headers";
import { createServerT, getLangFromCookies } from "@/lib/i18n/server";
import { PLATFORM_ACCOUNT_REF_COOKIE } from "@/lib/platform-session-cookies";
import LoginForm from "./LoginForm";

const OAUTH_ERROR_KEYS: Record<string, string> = {
  google_config: "auth.oauth.googleConfig",
  google_state: "auth.oauth.googleState",
  google_denied: "auth.oauth.googleDenied",
  google_code: "auth.oauth.googleCode",
  google_token: "auth.oauth.googleToken",
  google_profile: "auth.oauth.googleProfile",
  google_email: "auth.oauth.googleEmail",
  google_db: "auth.oauth.googleDb",
  google_env_db: "auth.oauth.googleEnvDb",
};

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;

async function resolveSearchParams(raw: SearchParamsInput): Promise<Record<string, string | string[] | undefined>> {
  if (raw != null && typeof (raw as Promise<unknown>).then === "function") {
    return ((await raw) as Record<string, string | string[] | undefined>) ?? {};
  }
  return (raw as Record<string, string | string[] | undefined>) ?? {};
}

function firstString(v: string | string[] | undefined): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
}

export default async function LoginView({ searchParams }: { searchParams: SearchParamsInput }) {
  const sp = await resolveSearchParams(searchParams);
  const rawNext = firstString(sp.next);
  const nextPath =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext.slice(0, 512) : "/";
  const defaultEmail = firstString(sp.email);

  const jar = await cookies();
  const lang = getLangFromCookies(jar);
  const t = createServerT(lang);
  const hasPhpSession = Boolean(jar.get("PHPSESSID")?.value);
  const hasNextPlatform = Boolean(
    jar.get("bni_platform_account_id")?.value || jar.get(PLATFORM_ACCOUNT_REF_COOKIE)?.value,
  );
  const showPhpLegacyHint = hasPhpSession && !hasNextPlatform;

  const legacyRaw = process.env.NEXT_PUBLIC_LEGACY_SITE_URL?.trim() ?? "";
  const legacyBase = legacyRaw ? legacyRaw.replace(/\/$/, "") : null;

  const googleHref = `/api/auth/google${nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`;

  const errKey = firstString(sp.error);
  const oauthMessage =
    errKey && OAUTH_ERROR_KEYS[errKey] ? t(OAUTH_ERROR_KEYS[errKey]) : null;
  const oauthDetailRaw = firstString(sp.detail);
  const oauthDetail = oauthDetailRaw ? oauthDetailRaw : null;

  return (
    <section className="bni-auth-shell">
      <div className="container">
        <div className="bni-auth-card">
          <div className="bni-auth-card-accent" aria-hidden="true" />
          <div className="bni-auth-card-inner">
            <div className="text-center mb-4">
              <div className="bni-auth-icon-wrap" aria-hidden="true">
                <i className="fa-solid fa-right-to-bracket" />
              </div>
              <h1 className="bni-auth-title">{t("auth.loginTitle")}</h1>
              <p className="bni-auth-lead text-muted mb-1">{t("auth.loginLead")}</p>
              <div className="small text-muted text-center mb-0 px-1" style={{ lineHeight: 1.55 }}>
                <p className="mb-2 fw-semibold text-body-secondary" style={{ marginBottom: "0.5rem" }}>
                  {t("vision.mission")}
                </p>
                <p className="mb-2" style={{ marginBottom: "0.5rem" }}>
                  {t("vision.architecture")}
                </p>
                <p className="mb-2" style={{ marginBottom: "0.5rem" }}>
                  {t("vision.goal")}
                </p>
                <p className="mb-0">
                  <Link href="/#busy-participant-journey" className="text-primary text-decoration-none">
                    {t("vision.participantJourney")}
                  </Link>
                </p>
              </div>
            </div>
            {oauthMessage ? (
              <div className="alert alert-danger bni-auth-alert mb-4" role="alert">
                {oauthMessage}
                {oauthDetail && errKey === "google_denied" ? (
                  <span className="d-block small mt-1 text-break">{oauthDetail}</span>
                ) : null}
              </div>
            ) : null}
            {showPhpLegacyHint ? (
              <div className="alert alert-info bni-auth-alert mb-4" role="status">
                <strong className="d-block mb-1">{t("auth.legacyLoginTitle")}</strong>
                <span className="small d-block" style={{ lineHeight: 1.55 }}>
                  {t("auth.legacyLoginBody")}
                </span>
              </div>
            ) : null}
            <LoginForm
              nextPath={nextPath}
              legacyBase={legacyBase}
              googleHref={googleHref}
              defaultEmail={defaultEmail}
              googleUsesNextPlatformOAuth
            />
            <div className="text-center mt-3">
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
