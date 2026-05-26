export type PitchSlideLayout = "cover" | "content" | "metrics" | "image";

export type PitchMetric = { value: string; label: string };

export type PitchSlide = {
  id: string;
  layout: PitchSlideLayout;
  badge?: string;
  title: string;
  subtitle?: string;
  body?: string;
  metrics?: PitchMetric[];
  imageDataUrl?: string;
};

export type PitchDeckThemeId = "navy" | "emerald" | "indigo" | "sunset";

export type PitchDeckState = {
  id: string;
  title: string;
  revision: number;
  themeId: PitchDeckThemeId;
  fontFamily: string;
  layoutStyle: string;
  slides: PitchSlide[];
  shareEnabled: boolean;
  shareId: string;
  updatedAt: string;
};

export type PitchStructKey =
  | "overview"
  | "market"
  | "product"
  | "business"
  | "financials"
  | "team";
