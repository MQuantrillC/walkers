"use client";

import Link from "next/link";
import { useCallback, useState, type CSSProperties } from "react";
import { Walker } from "@/walker/Walker";
import type { WalkerAppearance } from "@/walker/appearance";
import { VIEWBOX, walkSpeedPx } from "@/walker/walkCss";
import styles from "./procession.module.css";

// `href` makes the walker clickable (e.g. to its public profile).
export type ProcessionWalker = { name: string; appearance: WalkerAppearance; href?: string };

// Walkers cross the band at exactly their ground speed, evenly spaced and
// with staggered phases.
export function Procession({ walkers, height = 150 }: { walkers: ProcessionWalker[]; height?: number }) {
  const [trackW, setTrackW] = useState(0);

  // Measure straight away, then follow resizes.
  const ref = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    setTrackW(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setTrackW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const walkerW = (height * VIEWBOX.width) / VIEWBOX.height;
  const n = walkers.length;
  const travel = trackW + walkerW;
  // Keep at least one walker-width between figures; widen the loop if the
  // screen is too narrow to fit everyone.
  const loop = Math.max(travel, n * walkerW * 1.15);
  const crossS = loop / walkSpeedPx(height);

  return (
    <div
      ref={ref}
      className={styles.procession}
      style={{ height: `${height + 28}px`, "--loop": `${loop}px`, "--walker-w": `${walkerW}px` } as CSSProperties}
    >
      {trackW > 0 &&
        walkers.map((w, i) => {
          const style = { animationDuration: `${crossS}s`, animationDelay: `${(-i / n) * crossS}s` };
          const figure = (
            <>
              <Walker appearance={w.appearance} height={height} phase={(i * 0.37) % 1} title={w.href ? undefined : w.name} />
              <span className={styles.name}>{w.name}</span>
            </>
          );
          return w.href ? (
            <Link key={`${w.name}-${i}`} href={w.href} className={styles.marcher} style={style}>
              {figure}
            </Link>
          ) : (
            <div key={`${w.name}-${i}`} className={styles.marcher} style={style}>
              {figure}
            </div>
          );
        })}
    </div>
  );
}
