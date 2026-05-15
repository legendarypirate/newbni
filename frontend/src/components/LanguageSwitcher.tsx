"use client";

import { usePathname } from "next/navigation";
import { BNI_ALLOWED_LANGS, BNI_LANGUAGES, type BniLangCode } from "@/lib/nav-php-parity";
import { useI18n } from "@/lib/i18n/client";

type Props = {
  /** When set, language links go to legacy PHP `change-lang.php`. */
  legacySiteUrl?: string;
  headerAuthUseNext?: boolean;
};

export function LanguageSwitcher({ legacySiteUrl, headerAuthUseNext = true }: Props) {
  const pathname = usePathname() ?? "/";
  const { lang: navLang, t } = useI18n();
  const curLang = BNI_LANGUAGES[navLang];

  const langHref = (code: BniLangCode) => {
    if (legacySiteUrl && !headerAuthUseNext) {
      return `${legacySiteUrl}/scripts/change-lang.php?lang=${encodeURIComponent(code)}`;
    }
    const next = encodeURIComponent(pathname || "/");
    return `/api/set-lang?lang=${encodeURIComponent(code)}&next=${next}`;
  };

  return (
    <div className="dropdown">
      <button
        className="btn btn-light btn-sm rounded-pill border px-2 px-md-3 d-flex align-items-center gap-1"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        title={t("nav.switchLang")}
      >
        <span aria-hidden>{curLang.flag}</span>
        <span className="fw-semibold small">{navLang.toUpperCase()}</span>
        <i className="fa-solid fa-chevron-down small opacity-50 d-none d-sm-inline" aria-hidden />
      </button>
      <ul
        className="dropdown-menu dropdown-menu-end shadow border-0 py-2"
        style={{ borderRadius: 12, minWidth: "11rem" }}
      >
        {BNI_ALLOWED_LANGS.map((lc) => {
          const row = BNI_LANGUAGES[lc];
          return (
            <li key={lc}>
              <a
                className={`dropdown-item py-2 d-flex align-items-center gap-2${navLang === lc ? " active" : ""}`}
                href={langHref(lc)}
              >
                <span aria-hidden>{row.flag}</span>
                <span>{row.name}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
