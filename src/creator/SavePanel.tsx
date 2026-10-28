"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { SignInButton } from "@/auth/SignInButton";
import { useI18n } from "@/i18n/I18nProvider";
import type { CloudSync } from "./useCloudSync";
import styles from "./creator.module.css";

const noSubscribe = () => () => {};
const signInFailed = () => new URLSearchParams(window.location.search).get("signin") === "failed";

// Save / publish controls under the live preview, or on the last step.
// `step` is where the visitor is in the creator, so signing in brings
// them back to it. `finale` lays them out for the last step, where
// `links` (share, see the walk) join the same row once published.
export function SavePanel({
  sync,
  step,
  onPublished,
  finale = false,
  links,
}: {
  sync: CloudSync;
  step: string;
  onPublished: () => void;
  finale?: boolean;
  links?: ReactNode;
}) {
  const { t, locale } = useI18n();
  const { auth } = useAuth();
  const failed = useSyncExternalStore(noSubscribe, signInFailed, () => false);
  const { remote, dirty, busy, error, notice } = sync;

  if (auth.status === "unavailable" || auth.status === "loading") {
    return <p className={styles.saveNote}>{t.creator.draftSaved}</p>;
  }

  if (auth.status === "signedOut") {
    return (
      <div className={finale ? styles.finalePanel : styles.savePanel}>
        {failed && <p className={styles.saveError}>{t.auth.failed}</p>}
        <p className={styles.saveNote}>{t.save.signInToSave}</p>
        <SignInButton next={`/${locale}/create?step=${step}`} className={styles.primary} />
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

  // Once published and saved, "Saved" adds nothing to "Published".
  const saveState =
    remote === undefined || hidden ? null : busy ? t.save.working : dirty ? t.save.unsaved : published ? null : t.save.saved;

  return (
    <div className={finale ? styles.finalePanel : styles.savePanel}>
      {(statusText || saveState) && (
        <p className={styles.saveStatus} data-status={remote?.status}>
          {statusText}
          {statusText && saveState && " · "}
          {saveState && <span className={styles.saveState}>{saveState}</span>}
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
          {published && links}
          {published && remote && (
            <Link className={styles.saveLink} href={`/${locale}/w/${remote.id}`}>
              {t.save.viewProfile}
            </Link>
          )}
        </div>
      )}
      {/* Rarely wanted, so it stays out of the way of sharing. */}
      {published && (
        <button className={styles.quiet} disabled={busy} onClick={() => sync.unpublish()}>
          {t.save.unpublish}
        </button>
      )}
      {error && <p className={styles.saveError}>{t.save.errors[error]}</p>}
      {notice === "loadedSaved" && <p className={styles.saveNote}>{t.save.loadedSaved}</p>}
      {notice === "keptLocal" && <p className={styles.saveNote}>{t.save.keptLocal}</p>}
    </div>
  );
}
