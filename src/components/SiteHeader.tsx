"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./siteHeader.module.css";

const LINKS = [
  { href: "/", label: "The Walk" },
  { href: "/create", label: "Create" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        WALKERS
      </Link>
      <nav className={styles.nav} aria-label="Main">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
