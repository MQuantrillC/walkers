"use client";

import { useRef, useState, type PointerEvent } from "react";
import { HeadParts } from "@/walker/Walker";
import {
  BRUSH_SIZES,
  FACE_LIMITS,
  INK,
  PALETTE,
  type FaceStroke,
  type WalkerAppearance,
} from "@/walker/appearance";
import { HEAD_BOX, distanceToStroke, roundPoint, simplify, strokePath, toBox } from "@/walker/face";
import styles from "./creator.module.css";

type Tool = "brush" | "eraser";

// Square view around the head, roomy enough for tall hair and a cap brim.
const VIEW = { x: 56, y: -1, size: 55 };
// Skip pointer samples closer than this to the previous one (box units).
const MIN_STEP = 0.004;
const ERASER_RADIUS = 0.035;

type Props = {
  appearance: WalkerAppearance;
  onAdd: (stroke: FaceStroke) => void;
  onReplace: (strokes: FaceStroke[]) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

function totalPoints(strokes: readonly FaceStroke[]) {
  return strokes.reduce((n, s) => n + s.points.length / 2, 0);
}

export function FaceEditor({ appearance, onAdd, onReplace, onUndo, onRedo, canUndo, canRedo }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState<string>(INK);
  const [size, setSize] = useState<number>(BRUSH_SIZES[1].size);
  // The stroke being drawn, or the strokes left after erasing so far. Refs
  // hold the truth (pointer events can arrive faster than React re-renders);
  // the state copies only drive what is drawn on screen.
  const liveRef = useRef<number[] | null>(null);
  const erasedRef = useRef<FaceStroke[] | null>(null);
  const [live, setLive] = useState<number[] | null>(null);
  const [erased, setErased] = useState<FaceStroke[] | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const strokes = appearance.face.strokes;
  const full =
    strokes.length >= FACE_LIMITS.strokes || totalPoints(strokes) >= FACE_LIMITS.totalPoints;

  function toSvg(e: { clientX: number; clientY: number }) {
    const m = svgRef.current?.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  function eraseAt(current: FaceStroke[], e: { clientX: number; clientY: number }) {
    const p = toSvg(e);
    if (!p) return current;
    const b = toBox(p.x, p.y);
    return current.filter((s) => distanceToStroke(s.points, b.x, b.y) > ERASER_RADIUS + s.size / 2);
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
      setNotice("This face has reached its drawing limit. Erase or undo a stroke to draw more.");
      return;
    }
    setNotice(null);
    const b = toBox(p.x, p.y);
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
      if (pts.length / 2 >= FACE_LIMITS.pointsPerStroke) break;
      const q = toSvg(s);
      if (!q) continue;
      const b = toBox(q.x, q.y);
      const u = roundPoint(b.x);
      const v = roundPoint(b.y);
      if (Math.hypot(u - pts[pts.length - 2], v - pts[pts.length - 1]) >= MIN_STEP) pts.push(u, v);
    }
    if (pts.length !== before) setLive([...pts]);
  }

  function finish() {
    const remaining = erasedRef.current;
    if (remaining) {
      if (remaining.length !== strokes.length) onReplace(remaining);
      erasedRef.current = null;
      setErased(null);
    }
    const pts = liveRef.current;
    if (pts) {
      const points = simplify(pts).map(roundPoint);
      if (totalPoints(strokes) + points.length / 2 <= FACE_LIMITS.totalPoints) onAdd({ color, size, points });
      else setNotice("That stroke would go over the drawing limit.");
      liveRef.current = null;
      setLive(null);
    }
  }

  const shown = erased ? { ...appearance, face: { ...appearance.face, strokes: erased } } : appearance;
  const brushPx = size * HEAD_BOX.size;

  return (
    <div className={styles.faceEditor}>
      <svg
        ref={svgRef}
        className={styles.faceCanvas}
        data-tool={tool}
        viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.size} ${VIEW.size}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="Face drawing area. Draw with a mouse, pen or finger."
      >
        <HeadParts
          a={shown}
          drawing={
            live && (
              <path
                d={strokePath(live)}
                fill="none"
                stroke={color}
                strokeWidth={brushPx}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          }
        />
        {hover && (
          <circle
            cx={hover.x}
            cy={hover.y}
            r={tool === "eraser" ? ERASER_RADIUS * HEAD_BOX.size : brushPx / 2}
            fill="none"
            stroke={tool === "eraser" ? INK : color}
            strokeWidth={0.3}
            strokeDasharray={tool === "eraser" ? "0.8 0.6" : undefined}
            pointerEvents="none"
          />
        )}
      </svg>

      <div className={styles.toolRow} role="group" aria-label="Drawing tool">
        <button className={styles.chip} aria-pressed={tool === "brush"} onClick={() => setTool("brush")}>
          Brush
        </button>
        <button className={styles.chip} aria-pressed={tool === "eraser"} onClick={() => setTool("eraser")}>
          Eraser
        </button>
        <span className={styles.toolGap} />
        <button className={styles.chip} onClick={onUndo} disabled={!canUndo} aria-keyshortcuts="Control+Z">
          Undo
        </button>
        <button className={styles.chip} onClick={onRedo} disabled={!canRedo} aria-keyshortcuts="Control+Shift+Z">
          Redo
        </button>
        <button
          className={styles.chip}
          data-danger={confirmClear || undefined}
          disabled={strokes.length === 0}
          onClick={() => {
            if (!confirmClear) return setConfirmClear(true);
            onReplace([]);
            setConfirmClear(false);
          }}
          onBlur={() => setConfirmClear(false)}
        >
          {confirmClear ? "Tap again to clear" : "Clear"}
        </button>
      </div>

      <div className={styles.toolRow} role="group" aria-label="Brush size">
        {BRUSH_SIZES.map((b) => (
          <button
            key={b.size}
            className={styles.sizeButton}
            aria-pressed={size === b.size}
            aria-label={`${b.name} brush`}
            title={b.name}
            onClick={() => {
              setSize(b.size);
              setTool("brush");
            }}
          >
            <span style={{ width: 6 + b.size * 120, height: 6 + b.size * 120 }} />
          </button>
        ))}
        <span className={styles.toolGap} />
        {PALETTE.face.map((c) => (
          <button
            key={c.hex}
            className={styles.swatch}
            style={{ background: c.hex }}
            aria-pressed={color === c.hex}
            aria-label={c.name}
            title={c.name}
            onClick={() => {
              setColor(c.hex);
              setTool("brush");
            }}
          />
        ))}
      </div>

      <p className={styles.hint} aria-live="polite">
        {notice ??
          `Draw details on the face. ${strokes.length} of ${FACE_LIMITS.strokes} strokes used.`}
      </p>
    </div>
  );
}
