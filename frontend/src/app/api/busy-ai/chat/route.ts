import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BusyAITab = "factory" | "email" | "pitch" | "trip" | "translate";

type GroqChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

const systemPrompts: Record<BusyAITab, string> = {
  factory:
    "You are BUSY AI, a business sourcing assistant for Mongolian companies. Help users find manufacturers/suppliers, compare MOQ, certificates, risk, next actions, and draft outreach emails. Reply in Mongolian unless the user asks otherwise.",
  email:
    "You are BUSY AI, a B2B email writing assistant. Produce practical, polished emails with subject, body, optional bilingual version, and follow-up. Reply in Mongolian unless the user asks otherwise.",
  pitch:
    "You are BUSY AI, a startup pitch deck coach. Generate investor-ready pitch content. Always structure the answer in this order: Problem, Solution, Market, Business Model, Traction, Ask, Next Steps. Be specific, concise, and practical. Reply in Mongolian unless the user asks otherwise.",
  trip:
    "You are BUSY AI, a business travel planner. Create practical itineraries, meeting plans, budget estimates, and checklists for business trips. Reply in Mongolian unless the user asks otherwise.",
  translate:
    "You are BUSY AI, a professional business translator. Preserve meaning, tone, names, numbers, and terms. Explain important terminology briefly when useful. Reply in the target language requested by the user; otherwise Mongolian.",
};

function normalizeTab(raw: unknown): BusyAITab {
  if (raw === "email" || raw === "pitch" || raw === "trip" || raw === "translate") {
    return raw;
  }
  return "factory";
}

function cleanMessage(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().slice(0, 6000) : "";
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_groq_api_key",
        reply:
          "Real AI ашиглахын тулд frontend/.env дээр GROQ_API_KEY тохируулж dev server-ээ restart хийнэ үү.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as { tab?: unknown; message?: unknown } | null;
  const tab = normalizeTab(body?.tab);
  const message = cleanMessage(body?.message);

  if (!message) {
    return NextResponse.json({ ok: false, error: "message_required" }, { status: 400 });
  }

  const model = process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant";

  const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: tab === "pitch" ? 0.75 : 0.6,
      max_tokens: tab === "pitch" ? 1200 : 900,
      messages: [
        { role: "system", content: systemPrompts[tab] },
        { role: "user", content: message },
      ],
    }),
  });

  const data = (await upstream.json().catch(() => null)) as GroqChatResponse | null;
  const reply = data?.choices?.[0]?.message?.content?.trim();

  if (!upstream.ok || !reply) {
    return NextResponse.json(
      {
        ok: false,
        error: "groq_request_failed",
        reply: data?.error?.message || "AI service түр ажиллахгүй байна. Дахин оролдоно уу.",
      },
      { status: upstream.ok ? 502 : upstream.status },
    );
  }

  return NextResponse.json({ ok: true, reply, model });
}
