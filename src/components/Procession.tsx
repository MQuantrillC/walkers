"use client";

import Link from "next/link";
import { memo, useCallback, useState, type AnimationEvent, type CSSProperties } from "react";
import { Walker } from "@/walker/Walker";
import type { WalkerAppearance } from "@/walker/appearance";
import { VIEWBOX, walkSpeedPx } from "@/walker/walkCss";
import styles from "./procession.module.css";

// `href` makes the walker clickable (e.g. to its public profile).
export type ProcessionWalker = { name: string; appearance: WalkerAppearance; href?: string };

// At most this many walkers are drawn in one band at a time; on wide
// screens they spread out instead. Each one's limbs repaint every frame, so
// this keeps the walk smooth with any number of walkers.
const MAX_ON_SCREEN = 5;

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
  const [offscreen, setOffscreen] = useState(false);
  // Laps completed by each slot.
  const [laps, setLaps] = useState<number[]>([]);

  // Measure straight away, then follow resizes.
  const ref = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    setTrackW(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setTrackW(entry.contentRect.width));
    ro.observe(el);
    // Out of view, everyone holds still: no work for frames nobody sees.
    const io = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const walkerW = (height * VIEWBOX.width) / VIEWBOX.height;
  const travel = trackW + walkerW;
  const spacing = Math.max(walkerW * 1.3, travel / MAX_ON_SCREEN);
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
      data-offscreen={offscreen || undefined}
      style={{ height: `${height + 28}px`, "--loop": `${loop}px`, "--walker-w": `${walkerW}px` } as CSSProperties}
    >
      {trackW > 0 &&
        Array.from({ length: slots }, (_, slot) => {
          const index = (slot + (laps[slot] ?? 0) * slots) % total;
          const w = walkers[index];
          // Offset by half a gap so someone is already on screen at the start.
          const style = { animationDuration: `${crossS}s`, animationDelay: `${(-(slot + 0.5) / slots) * crossS}s` };
          const figure = (
            <Figure
              key={`${index}-${w.name}`}
              walker={w}
              height={height}
              phase={(slot * 0.37) % 1}
            />
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

// One walker and their name. Memoised: when one walker finishes a lap and
// the next takes their place, the others don't re-render.
const Figure = memo(function Figure({ walker, height, phase }: { walker: ProcessionWalker; height: number; phase: number }) {
  return (
    <>
      <Walker appearance={walker.appearance} height={height} phase={phase} title={walker.href ? undefined : walker.name} />
      <span className={styles.name}>{walker.name}</span>
    </>
  );
});
