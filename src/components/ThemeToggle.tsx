"use client";

import { useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./siteHeader.module.css";

export const THEME_KEY = "walkers-theme";
const EVENT = "walkers-theme-change";
const DARK = "(prefers-color-scheme: dark)";

// Runs before first paint (see the root layout) so a saved choice never
// flashes the other theme.
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

function current(): "light" | "dark" {
  const forced = document.documentElement.dataset.theme;
  if (forced === "light" || forced === "dark") return forced;
  return window.matchMedia(DARK).matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK);
  media.addEventListener("change", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

// Switches between light and dark, remembering the choice on this device.
export function ThemeToggle() {
  const { t } = useI18n();
  const theme = useSyncExternalStore(subscribe, current, () => null);
  if (!theme) return <span className={styles.themePlaceholder} />;

  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      className={styles.theme}
      aria-label={next === "dark" ? t.nav.toDark : t.nav.toLight}
      title={next === "dark" ? t.nav.toDark : t.nav.toLight}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch {
          // Not remembered, but still switched for this visit.
        }
        window.dispatchEvent(new Event(EVENT));
      }}
    >
      {theme === "dark" ? (
        // Sun: switch to light.
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // Moon: switch to dark.
        <svg viewBox="0 0 24 24" aria-hidden>
          <path
            d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
