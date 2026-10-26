"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "@/components/statusPage.module.css";

export default function NotFound() {
  const { t, locale } = useI18n();
  return (
    <div className={styles.page}>
      <h1>{t.errors.notFoundTitle}</h1>
      <p>{t.errors.notFoundBody}</p>
      <Link className={styles.button} href={`/${locale}`}>
        {t.errors.home}
      </Link>
    </div>
  );
}
