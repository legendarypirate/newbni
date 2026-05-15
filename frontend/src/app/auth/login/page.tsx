import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerT, getLangFromCookies } from "@/lib/i18n/server";
import LoginView from "./LoginView";

export async function generateMetadata(): Promise<Metadata> {
  const lang = getLangFromCookies(await cookies());
  const t = createServerT(lang);
  return {
    title: `${t("auth.loginTitle")} | BUSY.mn`,
    description: t("auth.loginMetaDesc"),
  };
}

export const dynamic = "force-dynamic";

export default LoginView;
