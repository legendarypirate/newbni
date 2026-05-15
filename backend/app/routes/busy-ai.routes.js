"use strict";

const express = require("express");

const systemPrompts = {
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

function normalizeTab(raw) {
  return ["email", "pitch", "trip", "translate"].includes(raw) ? raw : "factory";
}

function cleanMessage(raw) {
  return typeof raw === "string" ? raw.trim().slice(0, 6000) : "";
}

module.exports = function busyAiRoutes(app) {
  const router = express.Router();

  router.post("/chat", async (req, res) => {
    try {
      const apiKey = String(process.env.GROQ_API_KEY || "").trim();
      if (!apiKey) {
        return res.status(503).json({
          ok: false,
          error: "missing_groq_api_key",
          reply: "Real AI ашиглахын тулд backend/.env дээр GROQ_API_KEY тохируулж backend server-ээ restart хийнэ үү.",
        });
      }

      const tab = normalizeTab(req.body && req.body.tab);
      const message = cleanMessage(req.body && req.body.message);
      if (!message) {
        return res.status(400).json({ ok: false, error: "message_required" });
      }

      const model = String(process.env.GROQ_MODEL || "llama-3.1-8b-instant").trim();
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

      const data = await upstream.json().catch(() => null);
      const reply = data && data.choices && data.choices[0] && data.choices[0].message
        ? String(data.choices[0].message.content || "").trim()
        : "";

      if (!upstream.ok || !reply) {
        return res.status(upstream.ok ? 502 : upstream.status).json({
          ok: false,
          error: "groq_request_failed",
          reply:
            (data && data.error && data.error.message) ||
            "AI service түр ажиллахгүй байна. Дахин оролдоно уу.",
        });
      }

      return res.json({ ok: true, reply, model });
    } catch (err) {
      console.error("busy-ai chat failed", err);
      return res.status(500).json({
        ok: false,
        error: "busy_ai_failed",
        reply: "AI service түр алдаатай байна. Дахин оролдоно уу.",
      });
    }
  });

  app.use("/api/busy-ai", router);
};
