import type { Locale } from "./config";
import { en, type Dictionary } from "./en";
import { es } from "./es";

// Both dictionaries are small, so they are bundled rather than loaded on
// demand; client components pick theirs through I18nProvider.
export const DICTIONARIES: Record<Locale, Dictionary> = { en, es };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
