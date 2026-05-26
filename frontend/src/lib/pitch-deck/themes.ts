import type { PitchDeckThemeId } from "./types";

export const PITCH_THEMES: Record<
  PitchDeckThemeId,
  { label: string; gradient: string; swatch: string }
> = {
  navy: {
    label: "Navy Pro",
    gradient: "linear-gradient(135deg, #0b2149 0%, #1e3a8a 100%)",
    swatch: "linear-gradient(to right, #0b2149, #2563eb)",
  },
  emerald: {
    label: "Emerald",
    gradient: "linear-gradient(135deg, #064e3b 0%, #059669 100%)",
    swatch: "linear-gradient(to right, #064e3b, #10b981)",
  },
  indigo: {
    label: "Indigo",
    gradient: "linear-gradient(135deg, #312e81 0%, #4f46e5 100%)",
    swatch: "linear-gradient(to right, #4338ca, #6366f1)",
  },
  sunset: {
    label: "Sunset",
    gradient: "linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)",
    swatch: "linear-gradient(to right, #7c2d12, #f97316)",
  },
};
