import type { NextRequest } from "next/server";
import { requireAdminFormResponsesSession, proxyAuthedJson } from "@admin/lib/admin-form-responses-api";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ responseId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const gate = await requireAdminFormResponsesSession(req, ["trip", "event"]);
  if (!gate.ok) return gate.response;

  const { responseId } = await ctx.params;
  const id = String(responseId || "").trim();
  if (!id) {
    return gate.response;
  }

  const body = await req.text();
  const { response } = await proxyAuthedJson(`/responses/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return response;
}
