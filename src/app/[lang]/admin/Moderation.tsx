"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { SignInButton } from "@/auth/SignInButton";
import { useI18n } from "@/i18n/I18nProvider";
import { Walker } from "@/walker/Walker";
import { getModerationQueue, moderate, type ModerationAction, type QueueItem } from "@/walker/moderation";
import styles from "./admin.module.css";

// Reported walkers for moderators: hide or restore, delete, or dismiss the
// reports. Everyone else just sees that the page isn't for them.
export function Moderation() {
  const { t, locale } = useI18n();
  const { auth } = useAuth();
  // undefined while loading; null for non-moderators.
  const [queue, setQueue] = useState<QueueItem[] | null | undefined>(undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (auth.status !== "signedIn") return;
    let cancelled = false;
    getModerationQueue().then((q) => {
      if (!cancelled) setQueue(q);
    });
    return () => {
      cancelled = true;
    };
  }, [auth.status]);

  async function act(id: string, action: ModerationAction) {
    setBusy(id);
    setFailed(false);
    const res = await moderate(id, action);
    if (res.ok) setQueue(await getModerationQueue());
    else setFailed(true);
    setBusy(null);
    setConfirm(null);
  }

  let body;
  if (auth.status === "signedOut") body = <SignInButton next={`/${locale}/admin`} className={styles.primary} />;
  else if (auth.status !== "signedIn" || queue === undefined) body = <p className={styles.note}>{t.me.loading}</p>;
  else if (queue === null) body = <p className={styles.note}>{t.admin.notAllowed}</p>;
  else if (!queue.length) body = <p className={styles.note}>{t.admin.empty}</p>;
  else
    body = (
      <ul className={styles.list}>
        {queue.map(({ walker, reports }) => (
          <li key={walker.id} className={styles.item}>
            <div className={`${styles.figure} paper`} style={{ "--wk-play": "paused" } as CSSProperties}>
              <Walker appearance={walker.appearance} height={130} phase={0.3} />
            </div>
            <div className={styles.details}>
              <p className={styles.name}>
                {walker.status === "published" ? (
                  <Link href={`/${locale}/w/${walker.id}`}>{walker.name}</Link>
                ) : (
                  walker.name
                )}{" "}
                <span className={styles.badge}>
                  {walker.status === "hidden" ? t.admin.hidden : t.admin.published}
                </span>
              </p>
              <p className={styles.count}>{t.admin.reportCount(reports.length)}</p>
              <ul className={styles.reports}>
                {reports.map((r) => (
                  <li key={r.id}>
                    <strong>{t.report.reasons[r.reason]}</strong>
                    {r.details && <> · {r.details}</>}
                  </li>
                ))}
              </ul>
              <div className={styles.actions}>
                {walker.status === "hidden" ? (
                  <button disabled={busy === walker.id} onClick={() => act(walker.id, "restore")}>
                    {t.admin.restore}
                  </button>
                ) : (
                  <button disabled={busy === walker.id} onClick={() => act(walker.id, "hide")}>
                    {t.admin.hide}
                  </button>
                )}
                <button disabled={busy === walker.id} onClick={() => act(walker.id, "dismiss")}>
                  {t.admin.dismiss}
                </button>
                <button
                  data-danger
                  disabled={busy === walker.id}
                  onBlur={() => setConfirm(null)}
                  onClick={() => (confirm === walker.id ? act(walker.id, "delete") : setConfirm(walker.id))}
                >
                  {confirm === walker.id ? t.admin.confirmDelete : t.admin.delete}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t.admin.title}</h1>
      {body}
      {failed && <p className={styles.error}>{t.admin.failed}</p>}
    </div>
  );
}
