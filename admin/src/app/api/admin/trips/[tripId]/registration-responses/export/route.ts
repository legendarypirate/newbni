import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { serverAuthedFetch } from "@admin/lib/server-authed-fetch";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ tripId: string }> };

/** UTF-8 CSV — proxies to Node API (no Prisma in Next). */
export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user || user.legacyRole !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { tripId: raw } = await ctx.params;
  const tripId = Math.max(0, Number.parseInt(raw.trim(), 10));
  if (!Number.isFinite(tripId) || tripId < 1) {
    return NextResponse.json({ error: "bad_trip_id" }, { status: 400 });
  }

  try {
    const res = await serverAuthedFetch(`/admin/trips/${tripId}/registration-responses/export`);
    if (!res.ok) {
      return NextResponse.json({ error: "failed" }, { status: res.status === 404 ? 404 : 400 });
    }
    const body = await res.text();
    const ct = res.headers.get("Content-Type") || "text/csv; charset=utf-8";
    const cd = res.headers.get("Content-Disposition") || `attachment; filename="trip${tripId}_hariultuud.csv"`;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Content-Disposition": cd,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
