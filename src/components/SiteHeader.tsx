"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALE_COOKIE } from "@/i18n/config";
import { useAuth } from "@/auth/AuthProvider";
import { useUserAgent } from "@/auth/SignInButton";
import { isInAppBrowser } from "@/lib/inAppBrowser";
import { ThemeToggle } from "./ThemeToggle";
import { WalkerMark } from "./icons";
import styles from "./siteHeader.module.css";

// The current path is only known at request time on dynamic routes (like a
// walker's profile), so the bar first renders without it: no "current page"
// underline, and the language switch goes to the other language's home.
export function SiteHeader() {
  return (
    <Suspense fallback={<HeaderBar pathname={null} />}>
      <HeaderWithPath />
    </Suspense>
  );
}

function HeaderWithPath() {
  return <HeaderBar pathname={usePathname()} />;
}

function HeaderBar({ pathname }: { pathname: string | null }) {
  const { locale, t } = useI18n();
  const { auth, signIn, signOut } = useAuth();
  // Inside Instagram & co. Google sign-in is blocked; pages explain instead.
  const inApp = isInAppBrowser(useUserAgent());
  const other = locale === "en" ? "es" : "en";
  const links = [
    { href: `/${locale}`, label: t.nav.walk },
    { href: `/${locale}/create`, label: t.nav.create },
    { href: `/${locale}/me`, label: t.nav.me },
  ];
  const here = pathname ?? `/${locale}`;
  const switchHref = pathname ? pathname.replace(/^\/(en|es)(?=\/|$)/, `/${other}`) : `/${other}`;

  return (
    <header className={styles.header}>
      <Link href={`/${locale}`} className={styles.brand} aria-label="WALKERS">
        <WalkerMark />
        <span>Walkers</span>
      </Link>
      <nav className={styles.nav} aria-label="Main">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className={styles.tools}>
        <ThemeToggle />
        {auth.status === "signedOut" && !inApp && (
          <button className={styles.account} onClick={() => signIn(here)}>
            {t.auth.signIn}
          </button>
        )}
        {auth.status === "signedIn" && (
          <button className={styles.account} onClick={() => signOut()}>
            {t.auth.signOut}
          </button>
        )}
        <Link
          href={switchHref}
          hrefLang={other}
          lang={other}
          className={styles.lang}
          aria-label={`${t.nav.language}: ${t.nav.switchTo}`}
          // Remember the choice so it beats location-based detection next time.
          onClick={() => {
            document.cookie = `${LOCALE_COOKIE}=${other}; path=/; max-age=31536000; samesite=lax`;
          }}
        >
          {other.toUpperCase()}
        </Link>
      </div>
    </header>
  );
}
