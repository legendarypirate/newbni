import type { BniLangCode } from "@/lib/nav-php-parity";
import {
  DEFAULT_FOOTER_PUBLIC_CONFIG,
  type FooterPublicConfig,
  type FooterUsefulLink,
} from "@/lib/footer-public-config";
import { translate } from "./translate";

const DEFAULT_LINK_KEYS = [
  "footer.links.privacy",
  "footer.links.terms",
  "footer.links.help",
  "footer.links.partner",
] as const;

/** Map default Mongolian link labels (admin DB) to i18n keys. */
function linkLabelKey(label: string, index: number): string | null {
  const trimmed = label.trim();
  const defaults = DEFAULT_FOOTER_PUBLIC_CONFIG.usefulLinks;
  const byIndex = index >= 0 && index < DEFAULT_LINK_KEYS.length ? DEFAULT_LINK_KEYS[index] : null;
  const idx = defaults.findIndex((d) => d.label === trimmed);
  if (idx >= 0 && idx < DEFAULT_LINK_KEYS.length) return DEFAULT_LINK_KEYS[idx];
  return byIndex;
}

function localizeUsefulLinks(links: FooterUsefulLink[], lang: BniLangCode): FooterUsefulLink[] {
  return links.map((item, index) => {
    const key = linkLabelKey(item.label, index);
    if (!key) return item;
    return { ...item, label: translate(lang, key) };
  });
}

/** Apply UI translations to footer config from site settings (phone/email/address stay as stored). */
export function localizeFooterPublicConfig(cfg: FooterPublicConfig, lang: BniLangCode): FooterPublicConfig {
  if (lang === "mn") return cfg;

  const d = DEFAULT_FOOTER_PUBLIC_CONFIG;
  const tagline =
    !cfg.tagline.trim() || cfg.tagline === d.tagline ? translate(lang, "footer.tagline") : cfg.tagline;
  const platformBlurb =
    !cfg.platformBlurb.trim() || cfg.platformBlurb === d.platformBlurb
      ? translate(lang, "footer.platformBlurb")
      : cfg.platformBlurb;

  return {
    ...cfg,
    tagline,
    contactColumnTitle: translate(lang, "footer.contact"),
    usefulLinksColumnTitle: translate(lang, "footer.usefulLinks"),
    platformColumnTitle: translate(lang, "footer.platform"),
    platformBlurb,
    usefulLinks: localizeUsefulLinks(cfg.usefulLinks, lang),
  };
}
