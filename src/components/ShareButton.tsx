"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Share } from "./icons";
import styles from "./shareButton.module.css";

// Uses the device's share sheet where there is one, otherwise copies the link.
export function ShareButton({ path, title }: { path: string; title: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        // Closing the sheet means "never mind"; anything else falls back to copying.
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t.me.copyLink, url);
    }
  }

  return (
    <button className={styles.button} onClick={share} aria-live="polite">
      <Share />
      {copied ? t.me.copied : t.me.share}
    </button>
  );
}
