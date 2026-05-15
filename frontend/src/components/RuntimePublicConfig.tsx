import { headers } from "next/headers";
import { publicApiBaseForServer } from "@/lib/client-api-base";

/**
 * Injects runtime backend API URL into the browser (`window.__BUSY_PUBLIC_CONFIG__`).
 * Uses request host mapping so admin builds without correct env still call testapi.
 */
export default async function RuntimePublicConfig() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const apiBase = publicApiBaseForServer(host);
  const publicApiUrl = apiBase.replace(/\/api$/, "");
  const cfg = JSON.stringify({ publicApiUrl });
  return (
    <script
      dangerouslySetInnerHTML={{ __html: `window.__BUSY_PUBLIC_CONFIG__=${cfg};` }}
    />
  );
}
