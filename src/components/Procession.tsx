"use client";

import { useCallback, useState, type CSSProperties } from "react";
import { Walker } from "@/walker/Walker";
import type { WalkerAppearance } from "@/walker/appearance";
import { VIEWBOX, walkSpeedPx } from "@/walker/walkCss";
import styles from "./procession.module.css";

export type ProcessionWalker = { name: string; appearance: WalkerAppearance };

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
        walkers.map((w, i) => (
          <div
            key={`${w.name}-${i}`}
            className={styles.marcher}
            style={{ animationDuration: `${crossS}s`, animationDelay: `${(-i / n) * crossS}s` }}
          >
            <Walker appearance={w.appearance} height={height} phase={(i * 0.37) % 1} title={w.name} />
            <span className={styles.name}>{w.name}</span>
          </div>
        ))}
    </div>
  );
}
