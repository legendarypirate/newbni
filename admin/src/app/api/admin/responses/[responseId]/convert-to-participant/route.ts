import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdminFormResponsesSession, proxyAuthedJson } from "@admin/lib/admin-form-responses-api";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ responseId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const gate = await requireAdminFormResponsesSession(req, ["trip", "event"]);
  if (!gate.ok) return gate.response;

  const { responseId } = await ctx.params;
  const id = String(responseId || "").trim();
  if (!id) {
    return NextResponse.json({ error: "bad_response_id" }, { status: 400 });
  }

  const { response } = await proxyAuthedJson(`/responses/${encodeURIComponent(id)}/convert-to-participant`, {
    method: "POST",
  });
  return response;
}
