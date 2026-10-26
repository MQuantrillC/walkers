"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Procession, type ProcessionWalker } from "./Procession";
import { useMediaQuery } from "@/lib/useMediaQuery";
import styles from "./gallery.module.css";

// The walk itself: it fills the screen, so scrolling down leaves only the
// walkers. `children` replaces the lanes (empty states, the still grid).
export function Walkway({
  walkers,
  onNearEnd,
  resetKey = "",
  children,
}: {
  walkers: ProcessionWalker[];
  onNearEnd?: () => void;
  // Changing it starts the lanes afresh (a new filter or search).
  resetKey?: string;
  children?: ReactNode;
}) {
  const [stageRef, stageH] = useStageHeight();
  const compact = useMediaQuery("(max-width: 560px)");
  return (
    <div className={`${styles.stage} paper`} ref={stageRef}>
      {children ??
        (stageH > 0 &&
          lanesFor(walkers.length, stageH, compact).map((lane) => (
            <Procession
              key={`${resetKey}|${lane.index}/${lane.count}`}
              walkers={walkers.filter((_, k) => k % lane.count === lane.index)}
              height={lane.height}
              onNearEnd={onNearEnd}
            />
          )))}
    </div>
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
