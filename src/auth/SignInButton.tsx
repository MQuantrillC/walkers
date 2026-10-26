"use client";

import { useState, useSyncExternalStore } from "react";
import { useAuth } from "./AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { chromeIntentUrl, isAndroid, isInAppBrowser } from "@/lib/inAppBrowser";
import styles from "./signIn.module.css";

const noSubscribe = () => () => {};
const userAgent = () => navigator.userAgent;

export function useUserAgent() {
  return useSyncExternalStore(noSubscribe, userAgent, () => "");
}

// "Continue with Google", or, inside Instagram/Facebook/TikTok's built-in
// browser (where Google blocks sign-in), a way out to the real browser.
export function SignInButton({ next, className }: { next: string; className?: string }) {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const ua = useUserAgent();

  if (isInAppBrowser(ua)) return <OpenInBrowser android={isAndroid(ua)} />;
  return (
    <button className={className} onClick={() => signIn(next)}>
      {t.auth.continueWithGoogle}
    </button>
  );
}

function OpenInBrowser({ android }: { android: boolean }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  // Read the URL at click time: the creator keeps the draft in its fragment.
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t.inApp.copyLink, window.location.href);
    }
  }

  return (
    <div className={styles.notice} role="note">
      <p className={styles.title}>{t.inApp.title}</p>
      <p className={styles.body}>{t.inApp.body}</p>
      {android ? (
        <button className={styles.primary} onClick={() => (window.location.href = chromeIntentUrl(window.location.href))}>
          {t.inApp.openChrome}
        </button>
      ) : (
        <p className={styles.steps}>{t.inApp.iosSteps}</p>
      )}
      <button className={styles.secondary} onClick={copy}>
        {copied ? t.me.copied : t.inApp.copyLink}
      </button>
    </div>
  );
}
