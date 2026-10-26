"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Procession, type ProcessionWalker } from "./Procession";
import { useMediaQuery } from "@/lib/useMediaQuery";
import styles from "./gallery.module.css";

// The walk itself: one path across the whole screen, everyone the same size,
// one behind the other. It fills the screen, so scrolling down leaves only
// the walkers. `children` replaces the path (empty states, the still grid).
export function Walkway({
  walkers,
  onNearEnd,
  resetKey = "",
  children,
}: {
  walkers: ProcessionWalker[];
  onNearEnd?: () => void;
  // Changing it starts the walk afresh (a new filter or search).
  resetKey?: string;
  children?: ReactNode;
}) {
  const [stageRef, stageH] = useStageHeight();
  const compact = useMediaQuery("(max-width: 560px)");
  // Big enough to read every outfit, small enough that several fit across.
  const height = Math.round(Math.min(stageH * 0.42, compact ? 240 : 340));
  return (
    <div className={`${styles.stage} paper`} ref={stageRef}>
      {children ??
        (stageH > 0 && <Procession key={resetKey} walkers={walkers} height={height} onNearEnd={onNearEnd} />)}
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
