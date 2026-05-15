import type { BniLangCode } from "@/lib/nav-php-parity";
import { catalogCn } from "./catalogs/cn";
import { catalogEn } from "./catalogs/en";
import { catalogJp } from "./catalogs/jp";
import { catalogKr } from "./catalogs/kr";
import { catalogMn } from "./catalogs/mn";

export type MessageTree = { [key: string]: string | MessageTree };

const CATALOGS: Record<BniLangCode, MessageTree> = {
  mn: catalogMn,
  en: catalogEn,
  cn: catalogCn,
  kr: catalogKr,
  jp: catalogJp,
};

function walk(tree: MessageTree | undefined, parts: string[]): string | undefined {
  let node: string | MessageTree | undefined = tree;
  for (const part of parts) {
    if (!node || typeof node !== "object" || Array.isArray(node)) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

/** Resolve UI string by dot path; falls back to Mongolian then the key. */
export function translate(lang: BniLangCode, key: string): string {
  const parts = key.split(".").filter(Boolean);
  if (parts.length === 0) return "";
  const primary = walk(CATALOGS[lang], parts);
  if (primary) return primary;
  if (lang !== "mn") {
    const fallback = walk(CATALOGS.mn, parts);
    if (fallback) return fallback;
  }
  return parts[parts.length - 1] ?? key;
}

export function createTranslator(lang: BniLangCode) {
  return (key: string) => translate(lang, key);
}
