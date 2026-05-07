import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import BackendApiFetchPatch from "@/components/BackendApiFetchPatch";
import RuntimePublicConfig from "@/components/RuntimePublicConfig";
import TokenHandler from "./TokenHandler";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin | BUSY.mn",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="stylesheet" href="/assets/css/main.css" />
        <link rel="stylesheet" href="/assets/css/auth-pages.css" />
        <link rel="stylesheet" href="/assets/css/busy-ui-unified.css" />
      </head>
      <body>
        <RuntimePublicConfig />
        <BackendApiFetchPatch />
        <Suspense><TokenHandler /></Suspense>
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
