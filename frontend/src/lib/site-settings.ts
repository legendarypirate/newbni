import { internalApiUrl } from "@/lib/backend-api";

export async function getSiteSetting(name: string): Promise<string> {
  try {
    const res = await fetch(internalApiUrl(`/api/site-settings/${encodeURIComponent(name)}`), {
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; settingValue?: string } | null;
    if (!res.ok || !json?.ok) return "";
    return String(json.settingValue || "").trim();
  } catch {
    return "";
  }
}

export async function getSiteTitle(): Promise<string> {
  const t = await getSiteSetting("site_title");
  return t || "BUSY.mn";
}

export async function getSiteDescription(): Promise<string> {
  const d = await getSiteSetting("site_description");
  return d || "Бизнес аялал, хурал, эвент — BUSY.mn";
}
