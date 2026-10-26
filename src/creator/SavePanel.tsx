"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { SignInButton } from "@/auth/SignInButton";
import { useI18n } from "@/i18n/I18nProvider";
import type { CloudSync } from "./useCloudSync";
import styles from "./creator.module.css";

const noSubscribe = () => () => {};
const signInFailed = () => new URLSearchParams(window.location.search).get("signin") === "failed";

// Save / publish controls under the live preview.
export function SavePanel({ sync, onPublished }: { sync: CloudSync; onPublished: () => void }) {
  const { t, locale } = useI18n();
  const { auth } = useAuth();
  const failed = useSyncExternalStore(noSubscribe, signInFailed, () => false);
  const { remote, dirty, busy, error, notice } = sync;

  if (auth.status === "unavailable" || auth.status === "loading") {
    return <p className={styles.saveNote}>{t.creator.draftSaved}</p>;
  }

  if (auth.status === "signedOut") {
    return (
      <div className={styles.savePanel}>
        {failed && <p className={styles.saveError}>{t.auth.failed}</p>}
        <p className={styles.saveNote}>{t.save.signInToSave}</p>
        <SignInButton next={`/${locale}/create`} className={styles.primary} />
      </div>
    );
  }

  const hidden = remote?.status === "hidden";
  const published = remote?.status === "published";
  const statusText = !remote
    ? null
    : hidden
      ? t.save.statusHidden
      : published
        ? t.save.statusPublished
        : t.save.statusDraft;

  return (
    <div className={styles.savePanel}>
      {statusText && <p className={styles.saveStatus}>{statusText}</p>}
      {remote !== undefined && !hidden && (
        <p className={styles.saveNote}>
          {busy ? t.save.working : dirty ? t.save.unsaved : t.save.saved}
        </p>
      )}
      {!hidden && (
        <div className={styles.previewActions}>
          {!published && (
            <button className={styles.chip} disabled={busy || !dirty} onClick={() => sync.save(false)}>
              {t.save.save}
            </button>
          )}
          {(!published || dirty) && (
            <button
              className={styles.primary}
              disabled={busy || remote === undefined}
              onClick={async () => {
                if (await sync.save(true)) onPublished();
              }}
            >
              {published ? t.save.update : t.save.publish}
            </button>
          )}
          {published && (
            <button className={styles.chip} disabled={busy} onClick={() => sync.unpublish()}>
              {t.save.unpublish}
            </button>
          )}
        </div>
      )}
      {error && <p className={styles.saveError}>{t.save.errors[error]}</p>}
      {notice === "loadedSaved" && <p className={styles.saveNote}>{t.save.loadedSaved}</p>}
      {notice === "keptLocal" && <p className={styles.saveNote}>{t.save.keptLocal}</p>}
      {published && remote && (
        <Link className={styles.saveLink} href={`/${locale}/w/${remote.id}`}>
          {t.save.viewProfile} →
        </Link>
      )}
    </div>
  );
}
