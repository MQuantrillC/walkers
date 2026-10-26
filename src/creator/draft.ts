import { DEFAULT_APPEARANCE, NAME_MAX, type WalkerAppearance } from "@/walker/appearance";
import { sanitizeAppearance } from "@/walker/validate";

// The in-progress walker is kept on this device so nothing is lost before
// the visitor signs in. Storage can be unavailable (private mode, blocked
// site data), so every access is guarded and failure just means no draft.

// v2: paint on several surfaces, separate headwear/eyewear, extras.
const KEY = "walkers:draft:v2";

export type Draft = { name: string; appearance: WalkerAppearance };

export const EMPTY_DRAFT: Draft = { name: "", appearance: DEFAULT_APPEARANCE };

export function readDraftRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function parseDraft(raw: string | null): Draft {
  if (!raw) return EMPTY_DRAFT;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return EMPTY_DRAFT;
    const d = data as Record<string, unknown>;
    const name = typeof d.name === "string" ? d.name.slice(0, NAME_MAX) : "";
    return { name, appearance: sanitizeAppearance(d.appearance) };
  } catch {
    return EMPTY_DRAFT;
  }
}

export function writeDraft(draft: Draft): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
