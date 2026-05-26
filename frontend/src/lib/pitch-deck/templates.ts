import type { PitchDeckState, PitchSlide, PitchStructKey } from "./types";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createSlide(partial?: Partial<PitchSlide>): PitchSlide {
  return {
    id: uid(),
    layout: "content",
    badge: "Слайд",
    title: "Гарчиг",
    subtitle: "",
    body: "Агуулгаа энд бичнэ үү.",
    metrics: [],
    ...partial,
  };
}

const STRUCT_TEMPLATES: Record<
  PitchStructKey,
  { icon: string; label: string; slide: Omit<PitchSlide, "id"> }
> = {
  overview: {
    icon: "fa-regular fa-building",
    label: "Компанийн тойм",
    slide: {
      layout: "cover",
      badge: "Компанийн тойм",
      title: "Компанийн нэр",
      subtitle: "Товч танилцуулга",
      body: "Юу хийдэг, хэнд зориулсан, яагаад одоо гэдгийг тодорхой бичнэ үү.",
      metrics: [
        { value: "₮0", label: "Зорилтот хөрөнгө" },
        { value: "0%", label: "Өсөлт" },
        { value: "0", label: "Хэрэглэгч" },
      ],
    },
  },
  market: {
    icon: "fa-solid fa-chart-pie",
    label: "Зах зээлийн боломж",
    slide: {
      layout: "content",
      badge: "Зах зээл",
      title: "Зах зээлийн боломж",
      body: "TAM / SAM / SOM, өсөлтийн хурд, гол драйверуудыг тайлбарлана.",
    },
  },
  product: {
    icon: "fa-solid fa-cube",
    label: "Бүтээгдэхүүн",
    slide: {
      layout: "content",
      badge: "Бүтээгдэхүүн",
      title: "Бүтээгдэхүүн ба шийдэл",
      body: "Гол функц, давуу тал, хэрэглэгчийн туршлагыг танилцуулна.",
    },
  },
  business: {
    icon: "fa-solid fa-sitemap",
    label: "Бизнес модель",
    slide: {
      layout: "content",
      badge: "Бизнес модель",
      title: "Орлогын эх үүсвэр",
      body: "Хэрхэн мөнгө олох вэ — үнэ, давтамж, гол сегмент.",
    },
  },
  financials: {
    icon: "fa-solid fa-money-bill-trend-up",
    label: "Санхүүгийн төсөөлөл",
    slide: {
      layout: "metrics",
      badge: "Санхүү",
      title: "Санхүүгийн төсөөлөл",
      body: "3–5 жилийн орлого, маржин, гол зардал.",
      metrics: [
        { value: "₮0", label: "Орлого (жил)" },
        { value: "0%", label: "Маржин" },
        { value: "₮0", label: "Зардал" },
      ],
    },
  },
  team: {
    icon: "fa-solid fa-users-gear",
    label: "Баг",
    slide: {
      layout: "content",
      badge: "Баг",
      title: "Манай баг",
      body: "Гүйцэтгэх баг, зөвлөх, салбарын туршлагыг танилцуулна.",
    },
  },
};

export function slideFromStruct(key: PitchStructKey): PitchSlide {
  const t = STRUCT_TEMPLATES[key];
  return createSlide({ ...t.slide, badge: t.slide.badge ?? t.label });
}

export function structItems() {
  return (Object.keys(STRUCT_TEMPLATES) as PitchStructKey[]).map((key) => ({
    key,
    ...STRUCT_TEMPLATES[key],
  }));
}

export function createDefaultDeck(): PitchDeckState {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: "Миний Pitch Deck",
    revision: 1,
    themeId: "navy",
    fontFamily: "Nunito",
    layoutStyle: "modern",
    shareEnabled: false,
    shareId: uid(),
    updatedAt: now,
    slides: [
      createSlide({
        layout: "cover",
        badge: "Cover",
        title: "Төслийн нэр",
        subtitle: "Товч value proposition",
        body: "Хөрөнгө оруулагчдад зориулсан товч танилцуулга.",
        metrics: [
          { value: "₮0", label: "Зорилтот хөрөнгө" },
          { value: "0%", label: "Өсөлт" },
          { value: "0", label: "Хэрэглэгч" },
        ],
      }),
      createSlide({
        badge: "Асуудал",
        title: "Зах зээлийн асуудал",
        body: "Ямар асуудлыг шийдэх вэ?",
      }),
      createSlide({
        badge: "Шийдэл",
        title: "Манай шийдэл",
        body: "Бүтээгдэхүүн / үйлчилгээгээр хэрхэн шийдэх вэ?",
      }),
      createSlide({
        badge: "Зах зээл",
        title: "Зах зээлийн боломж",
        body: "Зах зээлийн хэмжээ, өсөлт.",
      }),
      createSlide({
        badge: "Бүтээгдэхүүн",
        title: "Бүтээгдэхүүн",
        body: "Гол онцлог, давуу тал.",
      }),
      createSlide({
        badge: "Бизнес модель",
        title: "Бизнес модель",
        body: "Орлогын урсгал.",
      }),
      createSlide({
        layout: "metrics",
        badge: "Санхүү",
        title: "Санхүүгийн төсөөлөл",
        body: "Тоо, хувь, хугацааны горим.",
        metrics: [
          { value: "₮0", label: "Орлого" },
          { value: "0%", label: "Маржин" },
          { value: "₮0", label: "Зардал" },
        ],
      }),
      createSlide({
        badge: "Баг",
        title: "Баг",
        body: "Гүйцэтгэх баг, зөвлөх.",
      }),
    ],
  };
}

/** Rough readiness score for investor-facing deck quality. */
export function computeReadinessPercent(deck: PitchDeckState): number {
  if (deck.slides.length === 0) return 0;
  let score = 0;
  const max = deck.slides.length * 3 + 2;
  if (deck.title.trim().length > 2) score += 2;
  for (const s of deck.slides) {
    if (s.title.trim().length > 2) score += 1;
    if ((s.body ?? "").trim().length > 20) score += 1;
    if (s.layout === "cover" && (s.subtitle ?? "").trim().length > 5) score += 1;
  }
  const hasCover = deck.slides.some((s) => s.layout === "cover");
  if (hasCover) score += 2;
  return Math.min(100, Math.round((score / max) * 100));
}
