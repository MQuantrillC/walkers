"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { SITE } from "@/lib/site";
import styles from "./siteFooter.module.css";

export function SiteFooter() {
  const { t, locale } = useI18n();
  return (
    <footer className={styles.footer}>
      <p className={styles.credit}>
        {t.footer.madeBy} {SITE.author}
      </p>
      <p className={styles.links}>
        <a href={SITE.personalPage} target="_blank" rel="noopener noreferrer">
          {t.footer.personalPage}
        </a>
        <span aria-hidden>•</span>
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
        <span aria-hidden>•</span>
        <a href={SITE.github} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <span aria-hidden>•</span>
        <Link href={`/${locale}/privacy`}>{t.footer.privacy}</Link>
      </p>
    </footer>
  );
}
