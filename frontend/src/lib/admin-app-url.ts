/**
 * Separate admin Next app (default :3002). When unset, paths stay relative (single-host / reverse-proxy setups).
 */
export function adminAppUrl(pathWithQuery: string): string {
  const base = process.env.NEXT_PUBLIC_ADMIN_APP_URL?.replace(/\/$/, "") ?? "";
  const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  if (!base) return path;
  return `${base}${path}`;
}
