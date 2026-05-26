import type { PitchDeckState } from "./types";
import { createDefaultDeck } from "./templates";

const DECK_KEY = "busy-pitch-deck-v1";
const SHARE_PREFIX = "busy-pitch-deck-share:";

function storageKey(accountHint?: string | null): string {
  const suffix = accountHint?.trim() || "guest";
  return `${DECK_KEY}:${suffix}`;
}

export function loadDeck(accountHint?: string | null): PitchDeckState {
  if (typeof window === "undefined") return createDefaultDeck();
  try {
    const raw = window.localStorage.getItem(storageKey(accountHint));
    if (!raw) return createDefaultDeck();
    const parsed = JSON.parse(raw) as PitchDeckState;
    if (!parsed?.slides?.length) return createDefaultDeck();
    return parsed;
  } catch {
    return createDefaultDeck();
  }
}

export function saveDeck(deck: PitchDeckState, accountHint?: string | null): void {
  if (typeof window === "undefined") return;
  const next = { ...deck, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(storageKey(accountHint), JSON.stringify(next));
}

export function loadSharedDeck(shareId: string): PitchDeckState | null {
  if (typeof window === "undefined" || !shareId.trim()) return null;
  try {
    const raw = window.localStorage.getItem(`${SHARE_PREFIX}${shareId}`);
    if (!raw) return null;
    return JSON.parse(raw) as PitchDeckState;
  } catch {
    return null;
  }
}

export function saveSharedDeck(deck: PitchDeckState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${SHARE_PREFIX}${deck.shareId}`, JSON.stringify(deck));
}

export function shareUrlForDeck(shareId: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://busy.mn";
  return `${origin}/investments?tab=pitchdeck&share=${encodeURIComponent(shareId)}`;
}

export function parseImportedDeck(raw: string): PitchDeckState | null {
  try {
    const parsed = JSON.parse(raw) as PitchDeckState;
    if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}
