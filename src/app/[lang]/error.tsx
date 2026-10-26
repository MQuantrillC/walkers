"use client";

import { useI18n } from "@/i18n/I18nProvider";
import styles from "@/components/statusPage.module.css";

// Shown when a page fails to render; the header and footer stay.
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  const { t } = useI18n();
  return (
    <div className={styles.page}>
      <h1>{t.errors.title}</h1>
      <p>{t.errors.body}</p>
      <button className={styles.button} onClick={() => retry()}>
        {t.errors.retry}
      </button>
    </div>
  );
}
