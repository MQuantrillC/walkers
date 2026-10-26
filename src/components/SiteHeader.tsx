"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { useAuth, type Profile } from "@/auth/AuthProvider";
import { useUserAgent } from "@/auth/SignInButton";
import { isInAppBrowser } from "@/lib/inAppBrowser";
import { ThemeToggle } from "./ThemeToggle";
import { WalkerMark } from "./icons";
import styles from "./siteHeader.module.css";

// The current path is only known at request time on dynamic routes (like a
// walker's profile), so the bar first renders without it: no "current page"
// mark, and the language switch goes to the other language's home.
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

// Closes a popup on a click outside `ref` or on Escape.
function useDismiss(open: boolean, close: () => void, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, ref]);
}

function HeaderBar({ pathname }: { pathname: string | null }) {
  const { locale, t } = useI18n();
  const { auth, signIn } = useAuth();
  // Inside Instagram & co. Google sign-in is blocked; pages explain instead.
  const inApp = isInAppBrowser(useUserAgent());
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const barRef = useRef<HTMLElement>(null);
  useDismiss(menuOpen, () => setMenuOpen(false), barRef);

  // Following a link closes the phone menu.
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  const links = [
    { href: `/${locale}`, label: t.nav.walk },
    { href: `/${locale}/create`, label: t.nav.create },
    { href: `/${locale}/me`, label: t.nav.me },
  ];
  const nav = (className: string) => (
    <nav className={className} aria-label="Main">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
  const settings = (
    <>
      <LanguageSwitch pathname={pathname} />
      <ThemeToggle />
    </>
  );

  return (
    <header className={styles.wrap} ref={barRef}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.bar}>
          <Link href={`/${locale}`} className={styles.brand}>
            <WalkerMark />
            <span>Walkers</span>
          </Link>
          {nav(styles.nav)}
          <div className={styles.tools}>
            <div className={styles.settings}>{settings}</div>
            {(auth.status === "signedIn" || (auth.status === "signedOut" && !inApp)) && (
              <span className={styles.separator} aria-hidden />
            )}
            {auth.status === "signedIn" && <AccountMenu profile={auth.profile} />}
            {auth.status === "signedOut" && !inApp && (
              <button className={styles.signIn} onClick={() => signIn(pathname ?? `/${locale}`)}>
                {t.auth.signIn}
              </button>
            )}
            <button
              className={styles.burger}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={menuOpen ? t.nav.closeMenu : t.nav.menu}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path
                  d={menuOpen ? "M6 6l12 12M18 6 6 18" : "M4 7.5h16M4 12h16M4 16.5h16"}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
        {/* Phones: destinations, language and theme behind the menu button. */}
        <div id="site-menu" className={styles.sheet} hidden={!menuOpen}>
          {nav(styles.sheetNav)}
          <div className={styles.sheetSettings}>{settings}</div>
        </div>
      </div>
    </header>
  );
}

// ES / EN as a segmented switch: the current language and the alternative.
// Switching keeps the page and remembers the choice over location detection.
function LanguageSwitch({ pathname }: { pathname: string | null }) {
  const { locale, t } = useI18n();
  const hrefFor = (l: Locale) => (pathname ? pathname.replace(/^\/(en|es)(?=\/|$)/, `/${l}`) : `/${l}`);
  return (
    <div className={styles.lang} role="group" aria-label={t.nav.language}>
      {(["es", "en"] as const).map((l) =>
        l === locale ? (
          <span key={l} aria-current="true">
            {l.toUpperCase()}
          </span>
        ) : (
          <Link
            key={l}
            href={hrefFor(l)}
            hrefLang={l}
            lang={l}
            aria-label={t.nav.switchTo}
            onClick={() => {
              document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
            }}
          >
            {l.toUpperCase()}
          </Link>
        ),
      )}
    </div>
  );
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

function AccountMenu({ profile }: { profile: Profile }) {
  const { locale, t } = useI18n();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), wrapRef);

  // Opening moves focus to the first item, as menus do.
  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  function onMenuKey(e: KeyboardEvent<HTMLDivElement>) {
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      items[(at + step + items.length) % items.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      items[e.key === "Home" ? 0 : items.length - 1]?.focus();
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      if (e.key === "Escape") buttonRef.current?.focus();
    }
  }

  return (
    <div className={styles.account} ref={wrapRef}>
      <button
        ref={buttonRef}
        className={styles.accountButton}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.nav.account}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.avatar}>
          {profile.avatarUrl && !photoFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" referrerPolicy="no-referrer" onError={() => setPhotoFailed(true)} />
          ) : (
            initials(profile.name)
          )}
        </span>
        <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden>
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className={styles.menu} role="menu" aria-label={t.nav.account} ref={menuRef} onKeyDown={onMenuKey}>
          <div className={styles.menuHead}>
            <strong>{profile.name}</strong>
            {profile.email && <span>{profile.email}</span>}
          </div>
          <Link role="menuitem" href={`/${locale}/me`} onClick={() => setOpen(false)}>
            {t.nav.me}
          </Link>
          <button
            role="menuitem"
            className={styles.menuDanger}
            onClick={() => {
              setOpen(false);
              signOut();
            }}
          >
            {t.auth.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
