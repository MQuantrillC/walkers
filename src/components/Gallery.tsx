"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { ProcessionWalker } from "./Procession";
import { Walkway } from "./Walkway";
import { Walker } from "@/walker/Walker";
import { browseWalkers } from "@/walker/actions";
import type { GalleryPage } from "@/walker/publicData";
import type { PublicWalker } from "@/walker/records";
import { useI18n } from "@/i18n/I18nProvider";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { Search } from "./icons";
import styles from "./gallery.module.css";

const toProcession = (lang: string) => (w: PublicWalker): ProcessionWalker => ({
  name: w.name,
  appearance: w.appearance,
  href: `/${lang}/w/${w.id}`,
});

// The public gallery: everyone, in the order they joined, optionally
// filtered by name. Pages load as the procession needs them.
// `featured` leads the line (and isn't repeated further back).
export function Gallery({ initial, featured }: { initial: GalleryPage; featured?: PublicWalker | null }) {
  const { t, locale } = useI18n();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [walkers, setWalkers] = useState<PublicWalker[]>(() =>
    featured ? [featured, ...initial.walkers.filter((w) => w.id !== featured.id)] : initial.walkers,
  );
  const [nextOffset, setNextOffset] = useState<number | null>(initial.nextOffset);
  const [loading, setLoading] = useState(false);
  const loadingMore = useRef(false);
  // The search the list currently shows.
  const shownQuery = useRef("");
  const still = useMediaQuery("(prefers-reduced-motion: reduce)");
  const compact = useMediaQuery("(max-width: 560px)");

  // Debounce typing into the search box.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);

  // New search: start again from the first page. The server already
  // rendered the unfiltered walk, so nothing to do until it changes.
  useEffect(() => {
    if (query === shownQuery.current) return;
    shownQuery.current = query;
    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    browseWalkers({ order: "everyone", query, offset: 0 })
      .then((page) => {
        if (cancelled) return;
        setWalkers(page.walkers);
        setNextOffset(page.nextOffset);
      })
      // Offline or unreachable: keep showing what's there.
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  async function loadMore() {
    if (nextOffset === null || loadingMore.current) return;
    loadingMore.current = true;
    try {
      const page = await browseWalkers({ order: "everyone", query, offset: nextOffset });
      setWalkers((prev) => {
        const seen = new Set(prev.map((w) => w.id));
        return [...prev, ...page.walkers.filter((w) => !seen.has(w.id))];
      });
      setNextOffset(page.nextOffset);
    } catch {
      // Unreachable for now: the walk keeps going round, and the next lap asks again.
    } finally {
      loadingMore.current = false;
    }
  }

  const nobodyYet = !walkers.length && !query && !loading;
  const height = compact ? 120 : 150;

  return (
    <section className={styles.gallery} aria-label={t.gallery.label}>
      {!nobodyYet && (
        <div className={`container ${styles.controls}`} role="search" aria-label={t.gallery.filters}>
          <label className={styles.searchBox}>
            <Search />
            <input
              className={styles.search}
              type="search"
              value={input}
              maxLength={24}
              placeholder={t.gallery.search}
              aria-label={t.gallery.search}
              onChange={(e) => setInput(e.target.value)}
            />
          </label>
        </div>
      )}

      {/* The walk itself fills the screen: scroll down and only the walkers
          are left. */}
      <Walkway
        walkers={walkers.map(toProcession(locale))}
        resetKey={query}
        onNearEnd={loadMore}
      >
        {nobodyYet ? (
          <p className={styles.empty}>{t.home.empty}</p>
        ) : !walkers.length ? (
          <p className={styles.empty}>{loading ? t.gallery.loading : t.gallery.noResults(query)}</p>
        ) : still ? (
          // Reduced motion: everyone standing still in a grid instead of walking.
          <div className={styles.grid} style={{ "--wk-play": "paused" } as CSSProperties}>
            {walkers.map((w, i) => (
              <Link key={w.id} href={`/${locale}/w/${w.id}`} className={styles.cell}>
                <Walker appearance={w.appearance} height={height} phase={(i * 0.37) % 1} title={w.name} />
                <span>{w.name}</span>
              </Link>
            ))}
            {nextOffset !== null && (
              <button className={styles.more} onClick={loadMore}>
                {t.gallery.more}
              </button>
            )}
          </div>
        ) : null}
      </Walkway>
    </section>
  );
}
