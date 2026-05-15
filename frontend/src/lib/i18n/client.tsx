"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isBniLang, type BniLangCode } from "@/lib/nav-php-parity";
import { translate } from "./translate";

type I18nContextValue = {
  lang: BniLangCode;
  setLang: (lang: BniLangCode) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readLangCookie(): BniLangCode {
  if (typeof document === "undefined") return "mn";
  const m = document.cookie.match(/(?:^|; )bni_lang=([^;]*)/);
  const raw = m?.[1] ? decodeURIComponent(m[1]) : "mn";
  return isBniLang(raw) ? raw : "mn";
}

export function I18nProvider({ initialLang, children }: { initialLang: BniLangCode; children: ReactNode }) {
  const [lang, setLangState] = useState<BniLangCode>(initialLang);

  useEffect(() => {
    setLangState(readLangCookie());
  }, []);

  const setLang = useCallback((next: BniLangCode) => {
    setLangState(next);
  }, []);

  const t = useCallback((key: string) => translate(lang, key), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: "mn",
      setLang: () => undefined,
      t: (key) => translate("mn", key),
    };
  }
  return ctx;
}

export function useT(): (key: string) => string {
  return useI18n().t;
}
