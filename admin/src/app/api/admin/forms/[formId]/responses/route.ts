import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdminFormResponsesSession, proxyAuthedJson } from "@admin/lib/admin-form-responses-api";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ formId: string }> };

/** Same-origin proxy: forwards admin cookies/JWT to Node `GET /api/forms/:formId/responses`. */
export async function GET(req: NextRequest, ctx: Ctx) {
  const gate = await requireAdminFormResponsesSession(req, ["trip", "event"]);
  if (!gate.ok) return gate.response;

  const { formId } = await ctx.params;
  const id = String(formId || "").trim();
  if (!id) {
    return NextResponse.json({ error: "bad_form_id" }, { status: 400 });
  }

  const { response } = await proxyAuthedJson(`/forms/${encodeURIComponent(id)}/responses`);
  return response;
}
