"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Procession, type ProcessionWalker } from "./Procession";
import { Walker } from "@/walker/Walker";
import { browseWalkers } from "@/walker/actions";
import type { GalleryOrder, GalleryPage } from "@/walker/publicData";
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

// The public gallery: everyone (in the order they joined) or the latest,
// optionally filtered by name. Pages load as the procession needs them.
export function Gallery({ initial }: { initial: GalleryPage }) {
  const { t, locale } = useI18n();
  const [order, setOrder] = useState<GalleryOrder>("everyone");
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [walkers, setWalkers] = useState<PublicWalker[]>(initial.walkers);
  const [nextOffset, setNextOffset] = useState<number | null>(initial.nextOffset);
  const [loading, setLoading] = useState(false);
  const loadingMore = useRef(false);
  const firstLoad = useRef(true);
  const still = useMediaQuery("(prefers-reduced-motion: reduce)");
  const compact = useMediaQuery("(max-width: 560px)");
  const [stageRef, stageH] = useStageHeight();

  // Debounce typing into the search box.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);

  // New order or search: start again from the first page. The server
  // already rendered the default view, so skip the very first run.
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    browseWalkers({ order, query, offset: 0 }).then((page) => {
      if (cancelled) return;
      setWalkers(page.walkers);
      setNextOffset(page.nextOffset);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [order, query]);

  async function loadMore() {
    if (nextOffset === null || loadingMore.current) return;
    loadingMore.current = true;
    const page = await browseWalkers({ order, query, offset: nextOffset });
    setWalkers((prev) => {
      const seen = new Set(prev.map((w) => w.id));
      return [...prev, ...page.walkers.filter((w) => !seen.has(w.id))];
    });
    setNextOffset(page.nextOffset);
    loadingMore.current = false;
  }

  const nobodyYet = !walkers.length && !query && !loading;
  const height = compact ? 120 : 150;

  return (
    <section className={styles.gallery} aria-label={t.gallery.label}>
      {!nobodyYet && (
        <div className={`container ${styles.controls}`} role="search" aria-label={t.gallery.filters}>
          <div className={styles.toggle}>
            {(["everyone", "latest"] as const).map((o) => (
              <button key={o} aria-pressed={order === o} onClick={() => setOrder(o)}>
                {o === "everyone" ? t.gallery.everyone : t.gallery.latest}
              </button>
            ))}
          </div>
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
      <div className={`${styles.stage} paper`} ref={stageRef}>
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
        ) : (
          stageH > 0 &&
          lanesFor(walkers.length, stageH, compact).map((lane) => (
            <Procession
              key={`${order}|${query}|${lane.index}/${lane.count}`}
              walkers={walkers.filter((_, k) => k % lane.count === lane.index).map(toProcession(locale))}
              height={lane.height}
              onNearEnd={loadMore}
            />
          ))
        )}
      </div>
    </section>
  );
}

// Tracks the walkway's height, which follows the screen's.
function useStageHeight() {
  const [value, setValue] = useState(0);
  const ref = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    setValue(el.clientHeight);
    const ro = new ResizeObserver(([entry]) => setValue(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, value] as const;
}

const NAME_BAND = 28;
// Front, middle and back lanes: further away is smaller (and, since walkers
// move at their own ground speed, slower).
const LANE_SCALE = [1, 0.7, 0.5];

// Splits the walkway into up to three lanes, filling the screen. Lane 0 is
// at the front (the bottom of the screen); the list is returned back to
// front, in page order.
function lanesFor(walkers: number, stageH: number, compact: boolean) {
  const count = Math.max(1, Math.min(LANE_SCALE.length, walkers, stageH < 520 ? 2 : 3));
  const scales = LANE_SCALE.slice(0, count);
  const room = stageH * 0.9 - count * NAME_BAND;
  const front = Math.min(room / scales.reduce((a, b) => a + b, 0), compact ? 300 : 420, stageH * 0.55);
  return scales.map((scale, index) => ({ index, count, height: Math.round(front * scale) })).reverse();
}
