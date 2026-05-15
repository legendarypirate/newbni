import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { legacyRoleAllowsEventAdminApi, legacyRoleAllowsTripAdminApi } from "@admin/lib/admin-access";
import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";

export async function requireAdminFormResponsesSession(
  req: NextRequest,
  scopes: Array<"trip" | "event"> = ["trip"],
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const user = await getApiPlatformUser(req);
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const allowed = scopes.some((scope) =>
    scope === "trip"
      ? legacyRoleAllowsTripAdminApi(user.legacyRole)
      : legacyRoleAllowsEventAdminApi(user.legacyRole),
  );
  if (!allowed) {
    return { ok: false, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true };
}

export async function proxyAuthedJson(
  path: string,
  init?: RequestInit,
): Promise<{ response: NextResponse; data?: unknown }> {
  const res = await serverAuthedFetch(path, init);
  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: "invalid_json" };
  }
  return {
    response: NextResponse.json(data, { status: res.status }),
    data,
  };
}
