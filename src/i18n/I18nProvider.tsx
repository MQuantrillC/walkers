"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "./config";
import { DICTIONARIES, type Dictionary } from "./dictionaries";

const I18nContext = createContext<{ locale: Locale; t: Dictionary }>({ locale: "en", t: DICTIONARIES.en });

// Only the locale crosses the server/client boundary; dictionaries contain
// functions, so each side looks its own up.
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <I18nContext value={{ locale, t: DICTIONARIES[locale] }}>{children}</I18nContext>;
}

export function useI18n() {
  return useContext(I18nContext);
}
