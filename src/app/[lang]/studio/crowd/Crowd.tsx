"use client";

import { useState, useSyncExternalStore } from "react";
import { Walkway } from "@/components/Walkway";
import { randomLook } from "@/creator/Creator";
import { BRUSH_SIZES, DEFAULT_APPEARANCE, PALETTE, PAINT_LIMITS, SURFACES, type Paint } from "@/walker/appearance";

const noSubscribe = () => () => {};
// Same page size as the real gallery.
const PAGE = 24;

// Random looks differ between server and browser, so the crowd is only
// made in the browser.
export function Crowd() {
  const inBrowser = useSyncExternalStore(noSubscribe, () => true, () => false);
  return inBrowser ? <RandomCrowd /> : null;
}

// ?n=50 walkers; ?paint=1 gives everyone as much drawing as allowed;
// ?paged=1 hands them over a page at a time, like the gallery loading more.
function RandomCrowd() {
  const [{ everyone, paged }] = useState(() => {
    const params = new URLSearchParams(location.search);
    const n = Math.min(500, Math.max(1, Number(params.get("n")) || 20));
    const painted = params.get("paint") === "1";
    return {
      paged: params.get("paged") === "1",
      everyone: Array.from({ length: n }, (_, i) => ({
        name: `Walker ${i + 1}`,
        appearance: { ...DEFAULT_APPEARANCE, ...randomLook(), ...(painted ? { paint: heavyPaint() } : {}) },
      })),
    };
  });
  const [shown, setShown] = useState(paged ? PAGE : everyone.length);
  const [loading, setLoading] = useState(false);

  function loadMore() {
    if (loading || shown >= everyone.length) return;
    setLoading(true);
    // A network round trip's worth of delay.
    setTimeout(() => {
      setShown((s) => Math.min(everyone.length, s + PAGE));
      setLoading(false);
    }, 400);
  }

  return <Walkway walkers={everyone.slice(0, shown)} onNearEnd={paged ? loadMore : undefined} />;
}

// Scribbles filling every surface up to the drawing limits, a few strokes
// at a time in one colour and brush, the way people tend to draw.
function heavyPaint(): Paint {
  const perSurface = Math.floor(PAINT_LIMITS.pointsTotal / SURFACES.length / 2);
  const strokes = Math.min(PAINT_LIMITS.strokesPerSurface, 20);
  const points = Math.floor(perSurface / strokes);
  const paint = {} as Paint;
  for (const s of SURFACES) {
    let color: string = PALETTE.paint[0].hex;
    let size: number = BRUSH_SIZES[0].size;
    paint[s] = Array.from({ length: strokes }, (_, k) => {
      if (k % 5 === 0) {
        color = PALETTE.paint[Math.floor(Math.random() * PALETTE.paint.length)].hex;
        size = BRUSH_SIZES[Math.floor(Math.random() * BRUSH_SIZES.length)].size;
      }
      let u = Math.random();
      let v = Math.random();
      const pts: number[] = [];
      for (let i = 0; i < points; i++) {
        u = Math.min(1, Math.max(0, u + (Math.random() - 0.5) * 0.08));
        v = Math.min(1, Math.max(0, v + (Math.random() - 0.5) * 0.08));
        pts.push(Math.round(u * 1000) / 1000, Math.round(v * 1000) / 1000);
      }
      return { color, size, points: pts };
    });
  }
  return paint;
}
