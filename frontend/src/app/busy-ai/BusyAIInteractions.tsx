"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/client-api-base";

type BusyAITab = "factory" | "email" | "pitch" | "trip" | "translate";

const fallbackReplies: Record<BusyAITab, string> = {
  factory:
    "Таны хүсэлтийг ойлголоо. Үйлдвэрийн төрөл, улс, MOQ, гэрчилгээний шаардлагаа нэмбэл нийлүүлэгчийн богино жагсаалт, анхны и-мэйлийн draft-ийг бэлдэнэ.",
  email:
    "И-мэйлийн зорилго, хүлээн авагч, хүсэж буй tone-оо өгвөл subject, body, follow-up хувилбарыг боловсруулж өгнө.",
  pitch:
    "Pitch deck-д problem, solution, market, business model, traction, ask хэсгийг дарааллаар нь сайжруулж болно.",
  trip:
    "Аяллын хот, огноо, төсөв, уулзах байгууллагын төрлөө бичвэл өдөрчилсөн хөтөлбөр, төсөв, checklist санал болгоно.",
  translate:
    "Орчуулах текстээ оруулаад зорилтот хэлээ сонгоно уу. Бизнес нэр томъёо, tone-ийг хадгалж хөрвүүлэхээр тохирууллаа.",
};

const pitchSlides: Record<
  string,
  {
    logo: string;
    brand: string;
    title: string;
    accent: string;
    suffix: string;
    subtitle: string;
    icon: string;
  }
> = {
  cover: {
    logo: "E",
    brand: "EcoRide",
    title: "Хотын хөдөлгөөнийг",
    accent: "Ногоон, Хялбар",
    suffix: "болгоё",
    subtitle: "Цахилгаан дугуй түрээсийн платформ",
    icon: "fa-solid fa-bicycle",
  },
  problem: {
    logo: "!",
    brand: "Problem",
    title: "Хотын богино зай",
    accent: "үнэтэй, удаан",
    suffix: "байна",
    subtitle: "Түгжрэл, зогсоол, шатахууны зардал өдөр тутмын хөдөлгөөнийг хүндрүүлдэг.",
    icon: "fa-solid fa-triangle-exclamation",
  },
  solution: {
    logo: "S",
    brand: "Solution",
    title: "Аппаар түрээслэх",
    accent: "цахилгаан дугуй",
    suffix: "сүлжээ",
    subtitle: "Ойр байрлах дугуйг QR-аар нээгээд, минутын тарифаар ашигладаг шийдэл.",
    icon: "fa-solid fa-mobile-screen-button",
  },
  market: {
    logo: "M",
    brand: "Market",
    title: "Улаанбаатарын",
    accent: "микро mobility",
    suffix: "боломж",
    subtitle: "Оюутан, оффис ажилтан, жуулчин, хүргэлтийн хэрэглээнд өдөр тутмын эрэлт бий.",
    icon: "fa-solid fa-chart-line",
  },
};

async function requestAI(activeTab: BusyAITab, message: string): Promise<{ reply: string; warning?: string }> {
  const res = await fetch(apiUrl("/busy-ai/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tab: activeTab, message }),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reply?: string; error?: string };
  const reply = data.reply?.trim();
  if (res.ok && data.ok && reply) {
    return { reply };
  }
  return {
    reply: reply || fallbackReplies[activeTab],
    warning: data.error === "missing_groq_api_key" ? "GROQ_API_KEY тохируулаагүй байна." : "AI service түр алдаатай байна.",
  };
}

function closestElement(target: EventTarget | null, selector: string): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>(selector) : null;
}

function appendMessage(chatBox: HTMLElement, role: "user" | "ai", text: string): HTMLElement | null {
  const history = chatBox.querySelector<HTMLElement>(".bai-chat-history");
  if (!history) return null;

  const row = document.createElement("div");
  row.className = role === "user" ? "bai-msg user" : "bai-msg";

  const avatar = document.createElement("div");
  avatar.className = "bai-msg-avatar";
  avatar.textContent = role === "user" ? "U" : "AI";

  const content = document.createElement("div");
  content.className = "bai-msg-content";

  const bubble = document.createElement("div");
  bubble.className = "bai-msg-bubble";
  bubble.textContent = text;

  const time = document.createElement("span");
  time.className = "bai-msg-time";
  time.textContent = new Intl.DateTimeFormat("mn-MN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  content.append(bubble, time);
  row.append(avatar, content);
  history.append(row);
  history.scrollTop = history.scrollHeight;
  return row;
}

function updateMessage(row: HTMLElement | null, text: string) {
  const bubble = row?.querySelector<HTMLElement>(".bai-msg-bubble");
  if (bubble) {
    bubble.textContent = text;
  }
}

function resetChat(chatBox: HTMLElement, activeTab: BusyAITab) {
  const history = chatBox.querySelector<HTMLElement>(".bai-chat-history");
  if (!history) return;
  history.innerHTML = "";
  appendMessage(chatBox, "ai", fallbackReplies[activeTab]);
}

function selectPitchSlide(slideId: string, navItem: HTMLElement) {
  const slide = pitchSlides[slideId];
  if (!slide) return;

  navItem.parentElement?.querySelectorAll(".pd-nav-item.active").forEach((item) => {
    item.classList.remove("active");
  });
  navItem.classList.add("active");

  const root = navItem.closest(".pd-grid") || document;
  const logo = root.querySelector<HTMLElement>("[data-pd-logo]");
  const brand = root.querySelector<HTMLElement>("[data-pd-brand]");
  const title = root.querySelector<HTMLElement>("[data-pd-title]");
  const subtitle = root.querySelector<HTMLElement>("[data-pd-subtitle]");
  const icon = root.querySelector<HTMLElement>("[data-pd-icon]");
  const watermark = root.querySelector<HTMLElement>("[data-pd-watermark]");

  if (logo) logo.textContent = slide.logo;
  if (brand) brand.textContent = slide.brand;
  if (title) {
    title.replaceChildren(
      document.createTextNode(`${slide.title} `),
      Object.assign(document.createElement("span"), { textContent: slide.accent }),
      document.createTextNode(` ${slide.suffix}`),
    );
  }
  if (subtitle) subtitle.textContent = slide.subtitle;
  if (icon) icon.className = slide.icon;
  if (watermark) {
    watermark.className = `${slide.icon} pd-preview-watermark`;
  }
}

export default function BusyAIInteractions({ activeTab }: { activeTab: BusyAITab }) {
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    async function sendFrom(chatBox: HTMLElement) {
      const input = chatBox.querySelector<HTMLInputElement>(".bai-input");
      const text = input?.value.trim() || "";
      if (!text) {
        setToast("Эхлээд асуултаа бичнэ үү.");
        input?.focus();
        return;
      }
      appendMessage(chatBox, "user", text);
      if (input) input.value = "";
      const pending = appendMessage(chatBox, "ai", "Боловсруулж байна...");
      try {
        const result = await requestAI(activeTab, text);
        updateMessage(pending, result.reply);
        if (result.warning) setToast(result.warning);
      } catch {
        updateMessage(pending, fallbackReplies[activeTab]);
        setToast("AI service-тэй холбогдож чадсангүй.");
      }
    }

    function onClick(event: MouseEvent) {
      const sendBtn = closestElement(event.target, ".bai-send-btn");
      if (sendBtn) {
        event.preventDefault();
        const chatBox = sendBtn.closest<HTMLElement>(".bai-chat-box");
        if (chatBox) sendFrom(chatBox);
        return;
      }

      const quickTag = closestElement(event.target, ".bai-quick-tag");
      if (quickTag) {
        const chatBox = quickTag.closest<HTMLElement>(".bai-chat-box");
        const input = chatBox?.querySelector<HTMLInputElement>(".bai-input");
        const value = quickTag.textContent?.trim() || "";
        if (input && value && value !== "+") {
          input.value = value;
          input.focus();
        }
        return;
      }

      const pitchNavItem = closestElement(event.target, ".pd-nav-item");
      if (pitchNavItem) {
        selectPitchSlide(pitchNavItem.dataset.slide || "cover", pitchNavItem);
        return;
      }

      const resetBtn = closestElement(event.target, ".fa-rotate-right");
      if (resetBtn) {
        const chatBox = resetBtn.closest<HTMLElement>(".bai-chat-box");
        if (chatBox) {
          resetChat(chatBox, activeTab);
          setToast("Chat шинэчлэгдлээ.");
        }
        return;
      }

      const toggle = closestElement(event.target, ".bai-lang-btn, .ts-lang-opt, .ts-sub-tab, .eml-lang-tab");
      if (toggle) {
        toggle.parentElement?.querySelectorAll(".active").forEach((node) => node.classList.remove("active"));
        toggle.classList.add("active");
        return;
      }

      const uploadZone = closestElement(event.target, ".bai-upload-zone");
      if (uploadZone) {
        setToast("Файл хавсаргах хэсэг бэлэн. AI боловсруулалт дараагийн шатанд холбоно.");
        return;
      }

      const copyBtn = closestElement(event.target, "button");
      if (copyBtn?.textContent?.includes("Хуулах")) {
        const editor = document.querySelector<HTMLElement>(".eml-content-area");
        const text = editor?.innerText.trim() || "";
        if (text) {
          void navigator.clipboard?.writeText(text);
          setToast("И-мэйл draft хуулагдлаа.");
        }
        return;
      }

      const deadLink = closestElement(event.target, 'a[href="#"]');
      if (deadLink) {
        event.preventDefault();
        setToast("Энэ жагсаалт демо горимд байна.");
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      const pitchNavItem = closestElement(event.target, ".pd-nav-item");
      if (pitchNavItem && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        selectPitchSlide(pitchNavItem.dataset.slide || "cover", pitchNavItem);
        return;
      }

      if (event.key !== "Enter" || event.shiftKey) return;
      const input = closestElement(event.target, ".bai-input");
      if (!input) return;
      event.preventDefault();
      const chatBox = input.closest<HTMLElement>(".bai-chat-box");
      if (chatBox) sendFrom(chatBox);
    }

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeTab]);

  return (
    <div
      className={`position-fixed bottom-0 start-50 translate-middle-x mb-4 px-3 py-2 rounded-3 shadow-sm bg-dark text-white small ${toast ? "" : "d-none"}`}
      role="status"
      aria-live="polite"
      style={{ zIndex: 1080 }}
    >
      {toast}
    </div>
  );
}
