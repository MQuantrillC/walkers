"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { HeadParts } from "@/walker/Walker";
import { INK } from "@/walker/appearance";
import { getWalkerLog, type LogEntry } from "@/walker/moderation";
import styles from "./admin.module.css";

// Moderators' log of every avatar: totals by status, then each one, newest
// first, with who made it and when (in the viewer's own time zone).
export function WalkerLog() {
  const { t, locale } = useI18n();
  // undefined while loading; null if it couldn't be read.
  const [log, setLog] = useState<LogEntry[] | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getWalkerLog()
      .then((entries) => {
        if (!cancelled) setLog(entries);
      })
      .catch(() => {
        if (!cancelled) setLog(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const when = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  const statusLabel = { published: t.admin.published, draft: t.admin.draft, hidden: t.admin.hidden };

  let body;
  if (log === undefined) body = <p className={styles.note}>{t.admin.logLoading}</p>;
  else if (log === null) body = <p className={styles.error}>{t.admin.logFailed}</p>;
  else if (!log.length) body = <p className={styles.note}>{t.admin.logEmpty}</p>;
  else {
    const count = (s: LogEntry["status"]) => log.filter((e) => e.status === s).length;
    body = (
      <>
        <dl className={styles.totals}>
          <div>
            <dt>{t.admin.total}</dt>
            <dd>{log.length}</dd>
          </div>
          {(["published", "draft", "hidden"] as const).map((s) => (
            <div key={s}>
              <dt>{statusLabel[s]}</dt>
              <dd>{count(s)}</dd>
            </div>
          ))}
        </dl>
        {log[0].owner === null && <p className={styles.note}>{t.admin.ownerUnknown}</p>}
        <ol className={styles.log}>
          {log.map((e) => (
            <li key={e.id} className={styles.logItem}>
              <svg className={styles.logHead} viewBox="52 -9 64 64" aria-hidden style={{ color: INK }}>
                <HeadParts a={e.appearance} />
              </svg>
              <div className={styles.details}>
                <p className={styles.name}>
                  {e.status === "published" ? <Link href={`/${locale}/w/${e.id}`}>{e.name}</Link> : e.name}{" "}
                  <span className={styles.badge} data-status={e.status}>
                    {statusLabel[e.status]}
                  </span>
                </p>
                {e.owner && (
                  <p className={styles.owner}>
                    {e.owner.name && <span>{e.owner.name}</span>}
                    {e.owner.email && <span>{e.owner.email}</span>}
                  </p>
                )}
                <p className={styles.dates}>
                  {t.admin.created} {when(e.createdAt)}
                  {" · "}
                  {e.publishedAt ? `${t.admin.publishedOn} ${when(e.publishedAt)}` : t.admin.notPublished}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </>
    );
  }

  return (
    <section className={styles.logSection} aria-labelledby="walker-log">
      <h2 id="walker-log" className={styles.sectionTitle}>
        {t.admin.log}
      </h2>
      <p className={styles.note}>{t.admin.logHelp}</p>
      {body}
    </section>
  );
}
