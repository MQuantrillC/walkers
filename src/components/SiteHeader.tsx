"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALE_COOKIE } from "@/i18n/config";
import styles from "./siteHeader.module.css";

export function SiteHeader() {
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const other = locale === "en" ? "es" : "en";
  const links = [
    { href: `/${locale}`, label: t.nav.walk },
    { href: `/${locale}/create`, label: t.nav.create },
  ];
  const switchHref = pathname.replace(/^\/(en|es)(?=\/|$)/, `/${other}`);

  return (
    <header className={styles.header}>
      <Link href={`/${locale}`} className={styles.brand}>
        WALKERS
      </Link>
      <nav className={styles.nav} aria-label="Main">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
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
      </nav>
    </header>
  );
}
