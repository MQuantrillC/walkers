"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { SignInButton } from "@/auth/SignInButton";
import { useI18n } from "@/i18n/I18nProvider";
import { WalkerStage } from "@/components/WalkerStage";
import { ShareButton } from "@/components/ShareButton";
import { deleteMyWalker, getMyWalker, setPublished, type ActionError } from "@/walker/actions";
import type { MyWalker as Saved } from "@/walker/records";
import { clearDraft } from "@/creator/draft";
import styles from "./me.module.css";

export function MyWalker() {
  const { t, locale } = useI18n();
  const { auth, signOut } = useAuth();
  // undefined while loading; null when there is no saved walker.
  const [walker, setWalker] = useState<Saved | null | undefined>(undefined);
  const [error, setError] = useState<ActionError | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (auth.status !== "signedIn") return;
    let cancelled = false;
    getMyWalker().then((res) => {
      if (cancelled) return;
      if (res.ok) setWalker(res.data);
      else setError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, [auth.status]);

  async function run(action: () => Promise<{ ok: true; data: Saved | null } | { ok: false; error: ActionError }>) {
    setBusy(true);
    setError(null);
    const res = await action();
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setWalker(res.data);
  }

  let body;
  if (auth.status === "unavailable") {
    body = <p className={styles.note}>{t.auth.unavailable}</p>;
  } else if (auth.status === "loading" || (auth.status === "signedIn" && walker === undefined && !error)) {
    body = <p className={styles.note}>{t.me.loading}</p>;
  } else if (auth.status === "signedOut") {
    body = (
      <>
        <p className={styles.note}>{t.me.signInPrompt}</p>
        <SignInButton next={`/${locale}/me`} className={styles.primary} />
      </>
    );
  } else if (!walker) {
    body = (
      <>
        <p className={styles.note}>{deleted ? t.me.deleted : t.me.empty}</p>
        <Link className={styles.primary} href={`/${locale}/create`}>
          {t.me.create}
        </Link>
      </>
    );
  } else {
    const published = walker.status === "published";
    const hidden = walker.status === "hidden";
    const profileUrl = `/${locale}/w/${walker.id}`;
    body = (
      <div className={styles.card}>
        <WalkerStage appearance={walker.appearance} height={300} title={walker.name} />
        <h2 className={styles.name}>{walker.name}</h2>
        <p className={styles.status}>
          {hidden ? t.save.statusHidden : published ? t.save.statusPublished : t.save.statusDraft}
        </p>
        {hidden && <p className={styles.note}>{t.me.hiddenHelp}</p>}
        <div className={styles.actions}>
          {!hidden && (
            <Link className={styles.chip} href={`/${locale}/create`}>
              {t.me.edit}
            </Link>
          )}
          {!hidden && !published && (
            <button className={styles.primary} disabled={busy} onClick={() => run(() => setPublished(true))}>
              {t.save.publish}
            </button>
          )}
          {published && (
            <button className={styles.chip} disabled={busy} onClick={() => run(() => setPublished(false))}>
              {t.save.unpublish}
            </button>
          )}
          <button
            className={styles.chip}
            data-danger={confirmDelete || undefined}
            disabled={busy}
            onBlur={() => setConfirmDelete(false)}
            onClick={async () => {
              if (!confirmDelete) return setConfirmDelete(true);
              setConfirmDelete(false);
              await run(async () => {
                const res = await deleteMyWalker();
                if (res.ok) {
                  clearDraft();
                  setDeleted(true);
                }
                return res;
              });
            }}
          >
            {confirmDelete ? t.me.confirmDelete : t.me.delete}
          </button>
        </div>
        {published && (
          <div className={styles.actions}>
            <Link className={styles.link} href={profileUrl}>
              {t.save.viewProfile} →
            </Link>
            <ShareButton path={profileUrl} title={t.profile.shareText(walker.name)} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t.me.title}</h1>
      {body}
      {error && <p className={styles.error}>{t.save.errors[error]}</p>}
      {auth.status === "signedIn" && (
        <button className={styles.signOut} onClick={() => signOut()}>
          {t.auth.signOut}
        </button>
      )}
    </div>
  );
}
