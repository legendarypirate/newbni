import Link from "next/link";
import { cookies } from "next/headers";
import { FooterContactList } from "@/components/FooterContactList";
import { FooterRichLink } from "@/components/FooterRichLink";
import { FooterSocialLinks } from "@/components/FooterSocialLinks";
import { getFooterPublicConfig } from "@/lib/footer-public-config";
import { localizeFooterPublicConfig } from "@/lib/i18n/footer-localize";
import { createServerT, getLangFromCookies } from "@/lib/i18n/server";

export default async function Footer() {
  const lang = getLangFromCookies(await cookies());
  const t = createServerT(lang);
  const currentYear = new Date().getFullYear();
  const cfg = localizeFooterPublicConfig(await getFooterPublicConfig(), lang);

  return (
    <footer className="footer-v3">
      <div className="container">
        <div className="footer-main-grid">
          <div className="footer-logo-area">
            <Link href="/" className="d-inline-block mb-3 text-decoration-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/finallogo.png" alt={cfg.brandName} style={{ height: 40, width: "auto" }} />
            </Link>
            <p className="desc">{cfg.tagline}</p>
            <FooterSocialLinks links={cfg.socialLinks} />
          </div>
          <div>
            <h4 className="footer-col-title">{cfg.contactColumnTitle}</h4>
            <FooterContactList contact={cfg.contact} />
          </div>
          <div>
            <h4 className="footer-col-title">{cfg.usefulLinksColumnTitle}</h4>
            <ul className="footer-links">
              {cfg.usefulLinks.map((item, idx) => (
                <li key={`${item.href}-${idx}`}>
                  <FooterRichLink href={item.href} className="text-reset text-decoration-none">
                    {item.label}
                  </FooterRichLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="footer-col-title">{cfg.platformColumnTitle}</h4>
            <p className="small text-muted mb-0">{cfg.platformBlurb}</p>
          </div>
        </div>
        <div className="pt-4 border-top">
          <p className="small text-muted m-0">
            © {currentYear} {cfg.copyrightName}. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
