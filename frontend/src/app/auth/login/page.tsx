import type { Metadata } from "next";
import { createServerT, getServerLang } from "@/lib/i18n/server";
import LoginView from "./LoginView";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const t = createServerT(lang);
  return {
    title: `${t("auth.loginTitle")} | BUSY.mn`,
    description: t("auth.loginMetaDesc"),
  };
}

export const dynamic = "force-dynamic";

export default LoginView;
