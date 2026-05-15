import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ContactPageForm } from "@/components/ContactPageForm";
import { FooterContactList } from "@/components/FooterContactList";
import { FooterSocialLinks } from "@/components/FooterSocialLinks";
import { getFooterPublicConfig } from "@/lib/footer-public-config";
import { localizeFooterPublicConfig } from "@/lib/i18n/footer-localize";
import { createServerT, getLangFromCookies } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = getLangFromCookies(await cookies());
  const t = createServerT(lang);
  return {
    title: `${t("contact.title")} | BUSY.mn`,
    description: t("contact.metaDesc"),
  };
}

export default async function ContactPage() {
  const lang = getLangFromCookies(await cookies());
  const t = createServerT(lang);
  const footerCfg = localizeFooterPublicConfig(await getFooterPublicConfig(), lang);

  return (
    <main className="py-4 py-md-5" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #f3f5f9 100%)" }}>
      <div className="container" style={{ maxWidth: 1040 }}>
        <header className="mb-4 mb-md-5 text-center text-md-start">
          <p className="text-uppercase small fw-bold text-primary mb-2" style={{ letterSpacing: "0.08em" }}>
            {footerCfg.brandName}
          </p>
          <h1 className="section-title-v2 mb-2">{t("contact.title")}</h1>
          <p className="text-muted mb-0 mx-auto mx-md-0" style={{ maxWidth: 520 }}>
            {t("contact.lead")}
          </p>
        </header>

        <div className="row g-4 align-items-start">
          <div className="col-lg-7 order-2 order-lg-1">
            <ContactPageForm />
          </div>
          <div className="col-lg-5 order-1 order-lg-2">
            <div className="rounded-3 border bg-white p-4 p-md-4 shadow-sm h-100">
              <h2 className="h6 text-uppercase text-muted mb-3" style={{ letterSpacing: "0.06em" }}>
                {t("contact.direct")}
              </h2>
              <FooterContactList contact={footerCfg.contact} className="footer-links list-unstyled mb-4" large />
              <hr className="my-4 opacity-25" />
              <h2 className="h6 text-uppercase text-muted mb-3" style={{ letterSpacing: "0.06em" }}>
                {t("contact.social")}
              </h2>
              <FooterSocialLinks links={footerCfg.socialLinks} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
