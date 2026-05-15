import type { BniLangCode } from "@/lib/nav-php-parity";
import { translate } from "./translate";

/** @deprecated Use dot-path string keys with `translate()` / `createServerT()` instead. */
export type MessageKey = string;

export function translateUi(lang: BniLangCode, key: string): string {
  return translate(lang, key);
}
