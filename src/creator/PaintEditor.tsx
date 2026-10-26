"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { HeadParts, LegParts, ShoeParts, TorsoParts } from "@/walker/Walker";
import {
  BRUSH_SIZES,
  INK,
  PAINT_LIMITS,
  PALETTE,
  type Stroke,
  type Surface,
  type WalkerAppearance,
} from "@/walker/appearance";
import { SURFACE_BOX, distanceToStroke, roundPoint, simplify, toBox } from "@/walker/paint";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./creator.module.css";

type Tool = "brush" | "eraser";

// What each surface's canvas shows, in that surface's frame.
const VIEWS: Record<Surface, { x: number; y: number; w: number; h: number; render: (a: WalkerAppearance) => ReactNode }> = {
  face: { x: 56, y: -1, w: 55, h: 55, render: (a) => <HeadParts a={a} /> },
  top: { x: 52, y: 37, w: 56, h: 92, render: (a) => <TorsoParts a={a} /> },
  bottom: { x: 55, y: 95, w: 52, h: 120, render: (a) => <LegParts a={a} /> },
  shoes: { x: -11, y: -25, w: 36, h: 36, render: (a) => <ShoeParts a={a} /> },
};

const MAX_CANVAS = { w: 400, h: 440 };
// Skip pointer samples closer than this to the previous one (box units).
const MIN_STEP = 0.003;
// Eraser reach in walker units.
const ERASER_RADIUS = 1.6;

type Props = {
  appearance: WalkerAppearance;
  surface: Surface;
  onAdd: (surface: Surface, stroke: Stroke) => void;
  onReplace: (surface: Surface, strokes: Stroke[]) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

function pointCount(strokes: readonly Stroke[]) {
  return strokes.reduce((n, s) => n + s.points.length / 2, 0);
}

export function PaintEditor({ appearance, surface, onAdd, onReplace, onUndo, onRedo, canUndo, canRedo }: Props) {
  const { t } = useI18n();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState<string>(INK);
  const [size, setSize] = useState<number>(BRUSH_SIZES[1].size);
  // The stroke being drawn, or the strokes left after erasing so far. Refs
  // hold the truth (pointer events can arrive faster than React re-renders);
  // the state copies only drive what is drawn on screen.
  const liveRef = useRef<number[] | null>(null);
  const erasedRef = useRef<Stroke[] | null>(null);
  const [live, setLive] = useState<number[] | null>(null);
  const [erased, setErased] = useState<Stroke[] | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const box = SURFACE_BOX[surface];
  const view = VIEWS[surface];
  const strokes = appearance.paint[surface];
  const allPoints = Object.values(appearance.paint).reduce((n, list) => n + pointCount(list), 0);
  // Room left for the next stroke: per surface and across the whole walker.
  const room = Math.min(PAINT_LIMITS.pointsPerSurface - pointCount(strokes), PAINT_LIMITS.pointsTotal - allPoints);
  const full = strokes.length >= PAINT_LIMITS.strokesPerSurface || room <= 0;

  function toSvg(e: { clientX: number; clientY: number }) {
    const m = svgRef.current?.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  function eraseAt(current: Stroke[], e: { clientX: number; clientY: number }) {
    const p = toSvg(e);
    if (!p) return current;
    const b = toBox(box, p.x, p.y);
    return current.filter(
      (s) => distanceToStroke(s.points, b.x, b.y) * box.size > ERASER_RADIUS + s.size / 2,
    );
  }

  function onPointerDown(e: PointerEvent<SVGSVGElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const p = toSvg(e);
    if (!p) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already gone; the stroke still ends on pointerup/leave.
    }
    setConfirmClear(false);
    if (tool === "eraser") {
      erasedRef.current = eraseAt(strokes, e);
      setErased(erasedRef.current);
      return;
    }
    if (full) {
      setNotice(t.paint.full);
      return;
    }
    setNotice(null);
    const b = toBox(box, p.x, p.y);
    liveRef.current = [roundPoint(b.x), roundPoint(b.y)];
    setLive(liveRef.current);
  }

  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    const p = toSvg(e);
    if (p) setHover(p);
    // Coalesced samples give smoother lines on fast moves; some browsers
    // don't support them or return an empty list.
    const coalesced = e.nativeEvent.getCoalescedEvents?.();
    const samples = coalesced?.length ? coalesced : [e.nativeEvent];
    if (erasedRef.current) {
      for (const s of samples) erasedRef.current = eraseAt(erasedRef.current, s);
      setErased(erasedRef.current);
      return;
    }
    const pts = liveRef.current;
    if (!pts) return;
    const before = pts.length;
    for (const s of samples) {
      if (pts.length / 2 >= PAINT_LIMITS.pointsPerStroke) break;
      const q = toSvg(s);
      if (!q) continue;
      const b = toBox(box, q.x, q.y);
      const u = roundPoint(b.x);
      const v = roundPoint(b.y);
      if (Math.hypot(u - pts[pts.length - 2], v - pts[pts.length - 1]) >= MIN_STEP) pts.push(u, v);
    }
    if (pts.length !== before) setLive([...pts]);
  }

  function finish() {
    const remaining = erasedRef.current;
    if (remaining) {
      if (remaining.length !== strokes.length) onReplace(surface, remaining);
      erasedRef.current = null;
      setErased(null);
    }
    const pts = liveRef.current;
    if (pts) {
      const points = simplify(pts).map(roundPoint);
      if (points.length / 2 <= room) {
        onAdd(surface, { color, size, points });
      } else {
        setNotice(t.paint.tooBig);
      }
      liveRef.current = null;
      setLive(null);
    }
  }

  // Draw through the real renderer so the live stroke is clipped exactly
  // like the saved ones.
  const shownStrokes = erased ?? (live ? [...strokes, { color, size, points: live }] : strokes);
  const shown = { ...appearance, paint: { ...appearance.paint, [surface]: shownStrokes } };
  const canvasMaxW = Math.min(MAX_CANVAS.w, (MAX_CANVAS.h * view.w) / view.h);
  const part = t.paint.surfaceNouns[surface];

  return (
    <div className={styles.paintEditor}>
      <svg
        ref={svgRef}
        className={styles.paintCanvas}
        style={{ aspectRatio: `${view.w} / ${view.h}`, maxWidth: canvasMaxW }}
        data-tool={tool}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={t.paint.canvasLabel(part)}
      >
        {view.render(shown)}
        {hover && (
          <circle
            cx={hover.x}
            cy={hover.y}
            r={tool === "eraser" ? ERASER_RADIUS : size / 2}
            fill="none"
            stroke={tool === "eraser" ? INK : color === "#ffffff" ? INK : color}
            strokeWidth={view.w / 200}
            strokeDasharray={tool === "eraser" ? `${view.w / 70} ${view.w / 100}` : undefined}
            pointerEvents="none"
          />
        )}
      </svg>

      <div className={styles.toolRow} role="group" aria-label={t.paint.tool}>
        <button className={styles.chip} aria-pressed={tool === "brush"} onClick={() => setTool("brush")}>
          {t.paint.brush}
        </button>
        <button className={styles.chip} aria-pressed={tool === "eraser"} onClick={() => setTool("eraser")}>
          {t.paint.eraser}
        </button>
        <span className={styles.toolGap} />
        <button className={styles.chip} onClick={onUndo} disabled={!canUndo} aria-keyshortcuts="Control+Z">
          {t.paint.undo}
        </button>
        <button className={styles.chip} onClick={onRedo} disabled={!canRedo} aria-keyshortcuts="Control+Shift+Z">
          {t.paint.redo}
        </button>
        <button
          className={styles.chip}
          data-danger={confirmClear || undefined}
          disabled={strokes.length === 0}
          onClick={() => {
            if (!confirmClear) return setConfirmClear(true);
            onReplace(surface, []);
            setConfirmClear(false);
          }}
          onBlur={() => setConfirmClear(false)}
        >
          {confirmClear ? t.paint.confirmClear : t.paint.clear}
        </button>
      </div>

      <div className={styles.toolRow} role="group" aria-label={t.paint.size}>
        {BRUSH_SIZES.map((b) => (
          <button
            key={b.size}
            className={styles.sizeButton}
            aria-pressed={size === b.size}
            aria-label={t.paint.sizes[b.id]}
            title={t.paint.sizes[b.id]}
            onClick={() => {
              setSize(b.size);
              setTool("brush");
            }}
          >
            <span style={{ width: 4 + b.size * 4, height: 4 + b.size * 4 }} />
          </button>
        ))}
      </div>

      <div className={styles.toolRow} role="group" aria-label={t.paint.colour}>
        {PALETTE.paint.map((c) => (
          <button
            key={c.hex}
            className={styles.swatch}
            style={{ background: c.hex }}
            aria-pressed={tool === "brush" && color === c.hex}
            aria-label={t.colors[c.id]}
            title={t.colors[c.id]}
            onClick={() => {
              setColor(c.hex);
              setTool("brush");
            }}
          />
        ))}
      </div>

      <p className={styles.hint} aria-live="polite">
        {notice ?? t.paint.hint(part, strokes.length, PAINT_LIMITS.strokesPerSurface)}
      </p>
    </div>
  );
}
