"use client";

import { useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Moon, Sun } from "./icons";
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
      {theme === "dark" ? <Sun /> : <Moon />}
    </button>
  );
}
