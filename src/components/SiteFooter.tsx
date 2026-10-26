"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./siteFooter.module.css";

export function SiteFooter() {
  const { t, locale } = useI18n();
  return (
    <footer className={styles.footer}>
      <span>WALKERS</span>
      <Link href={`/${locale}/privacy`}>{t.footer.privacy}</Link>
    </footer>
  );
}
