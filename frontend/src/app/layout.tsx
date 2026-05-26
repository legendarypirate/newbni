import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Suspense } from "react";
import BackendApiFetchPatch from "@/components/BackendApiFetchPatch";
import RuntimePublicConfig from "@/components/RuntimePublicConfig";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { marketingSiteOrigin } from "@/lib/marketing-site-origin";
import { I18nProvider } from "@/lib/i18n/client";
import { getServerLang, htmlLangAttr } from "@/lib/i18n/server";
import TokenHandler from "./TokenHandler";

function rootMetadataBase(): URL {
  try {
    return new URL(`${marketingSiteOrigin()}/`);
  } catch {
    return new URL("https://busy.mn/");
  }
}

export const metadata: Metadata = {
  metadataBase: rootMetadataBase(),
  title: "BUSY.mn",
  description: "BUSY Platform",
  icons: {
    icon: [{ url: "/fav.jpeg", type: "image/jpeg" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getServerLang();

  return (
    <html lang={htmlLangAttr(lang)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        
        <link rel="stylesheet" href="/assets/css/main.css" />
        <link rel="stylesheet" href="/assets/css/home-busy.css" />
        <link rel="stylesheet" href="/assets/css/busy-pages-v2.css" />
        <link rel="stylesheet" href="/assets/css/index-v3.css" />
        <link rel="stylesheet" href="/assets/css/trips-v3.css" />
        <link rel="stylesheet" href="/assets/css/trip-details-v3.css" />
        <link rel="stylesheet" href="/assets/css/factories-v3.css" />
        <link rel="stylesheet" href="/assets/css/investments-v3.css" />
        <link rel="stylesheet" href="/assets/css/members-v3.css" />
        <link rel="stylesheet" href="/assets/css/news-v3.css" />
        <link rel="stylesheet" href="/assets/css/busy-ai-v3.css" />
        <link rel="stylesheet" href="/assets/css/platform-v4.css" />
        <link rel="stylesheet" href="/assets/css/auth-pages.css" />
        <link rel="stylesheet" href="/assets/css/busy-ui-unified.css" />
      </head>
      <body className="page-home">
        <RuntimePublicConfig />
        <BackendApiFetchPatch />
        <Suspense><TokenHandler /></Suspense>
        <I18nProvider initialLang={lang}>
          <header className="site-header sticky-top border-bottom bg-white" style={{ zIndex: 1030 }}>
            <Navbar />
          </header>
          {children}
          <Footer />
        </I18nProvider>
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
