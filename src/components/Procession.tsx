"use client";

import Link from "next/link";
import { useCallback, useState, type AnimationEvent, type CSSProperties } from "react";
import { Walker } from "@/walker/Walker";
import type { WalkerAppearance } from "@/walker/appearance";
import { VIEWBOX, walkSpeedPx } from "@/walker/walkCss";
import styles from "./procession.module.css";

// `href` makes the walker clickable (e.g. to its public profile).
export type ProcessionWalker = { name: string; appearance: WalkerAppearance; href?: string };

// Walkers cross the band at exactly their ground speed, evenly spaced and
// with staggered phases. Only as many as fit on screen are drawn: each
// "slot" shows one walker and, every time it re-enters from the left, moves
// on to the next one in the list. A long gallery therefore looks endless
// without rendering everyone at once. `onNearEnd` asks for more walkers
// when the slots are about to run through the loaded ones.
export function Procession({
  walkers,
  height = 150,
  onNearEnd,
}: {
  walkers: ProcessionWalker[];
  height?: number;
  onNearEnd?: () => void;
}) {
  const [trackW, setTrackW] = useState(0);
  // Laps completed by each slot.
  const [laps, setLaps] = useState<number[]>([]);

  // Measure straight away, then follow resizes.
  const ref = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    setTrackW(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setTrackW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const walkerW = (height * VIEWBOX.width) / VIEWBOX.height;
  const travel = trackW + walkerW;
  const spacing = walkerW * 1.3;
  const slots = Math.min(walkers.length, Math.max(1, Math.ceil(travel / spacing)));
  const loop = Math.max(travel, slots * spacing);
  const crossS = loop / walkSpeedPx(height);
  const total = walkers.length;

  function lapDone(slot: number, e: AnimationEvent) {
    // Limb animations inside the walker bubble up too; only count the crossing.
    if (e.target !== e.currentTarget) return;
    const lap = (laps[slot] ?? 0) + 1;
    setLaps((prev) => {
      const next = [...prev];
      next[slot] = lap;
      return next;
    });
    if (onNearEnd && slot + (lap + 1) * slots >= total) onNearEnd();
  }

  return (
    <div
      ref={ref}
      className={`${styles.procession} paper`}
      style={{ height: `${height + 28}px`, "--loop": `${loop}px`, "--walker-w": `${walkerW}px` } as CSSProperties}
    >
      {trackW > 0 &&
        Array.from({ length: slots }, (_, slot) => {
          const index = (slot + (laps[slot] ?? 0) * slots) % total;
          const w = walkers[index];
          const style = { animationDuration: `${crossS}s`, animationDelay: `${(-slot / slots) * crossS}s` };
          const figure = (
            <>
              <Walker
                key={`${index}-${w.name}`}
                appearance={w.appearance}
                height={height}
                phase={(slot * 0.37) % 1}
                title={w.href ? undefined : w.name}
              />
              <span className={styles.name}>{w.name}</span>
            </>
          );
          return w.href ? (
            <Link
              key={slot}
              href={w.href}
              className={styles.marcher}
              style={style}
              onAnimationIteration={(e) => lapDone(slot, e)}
            >
              {figure}
            </Link>
          ) : (
            <div key={slot} className={styles.marcher} style={style} onAnimationIteration={(e) => lapDone(slot, e)}>
              {figure}
            </div>
          );
        })}
    </div>
  );
}
