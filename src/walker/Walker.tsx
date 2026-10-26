import type { CSSProperties, ReactNode } from "react";
import { RIG, poseAt, type GaitPose } from "./gait";
import { INK, type Stroke, type Surface, type WalkerAppearance } from "./appearance";
import { VIEWBOX, WALK_CSS } from "./walkCss";
import { HEAD, NOSE, SURFACE_BOX, strokePath } from "./paint";
import {
  BLUSH,
  BROWS,
  CROPPED,
  EXTRA_PATHS,
  EYES,
  EYEWEAR_LAYERS,
  FACIAL_HAIR_PATHS,
  HAIR,
  HEADWEAR_LAYERS,
  HAIR_CLIP,
  HAIR_UNDER_HAT,
  HOOD,
  HOODIE_STRING,
  LIMB,
  MOUTHS,
  NECK,
  SHIN_CLIP,
  SHOES,
  SHORTS,
  SKIRT,
  SOLE_COLOR,
  TEE_SLEEVE,
  THIGH_CLIP,
  TORSO_SEAT,
  TORSO_TOP,
  circle,
  type ItemLayer,
} from "./parts";

// Outline thickness. Overlapping limb segments are drawn in two passes, all
// ink first and then all fills, so a limb reads as one continuous shape.
const OUT = 2.2;

// Outlines take the SVG's text colour, so the surface a walker stands on
// decides them: dark ink on light paper, light lines on a dark walkway
// (see `.paper` in globals.css). Facial features always stay INK.
const LINE = "currentColor";

type Pass = "ink" | "fill";

// Darken a #rrggbb colour; used to push far-side limbs back.
function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(v * (1 - amount));
  const r = c((n >> 16) & 255);
  const g = c((n >> 8) & 255);
  const b = c(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function Seg({ pass, len, w, color }: { pass: Pass; len: number; w: number; color: string }) {
  return (
    <line
      x1={0}
      y1={0}
      x2={0}
      y2={len}
      stroke={pass === "ink" ? LINE : color}
      strokeWidth={pass === "ink" ? w + 2 * OUT : w}
      strokeLinecap="round"
    />
  );
}

// A shape that joins the limb outline (no edge drawn inside the union).
function Shape({ pass, d, color }: { pass: Pass; d: string; color: string }) {
  return pass === "ink" ? (
    <path d={d} fill={LINE} stroke={LINE} strokeWidth={2 * OUT} strokeLinejoin="round" />
  ) : (
    <path d={d} fill={color} />
  );
}

// A shape with its own complete outline, drawn over whatever is beneath it.
function Outlined({ d, color }: { d: string; color: string }) {
  return <path d={d} fill={color} stroke={LINE} strokeWidth={OUT} strokeLinejoin="round" />;
}

function Passes({ children }: { children: (pass: Pass) => ReactNode }) {
  return (
    <>
      {children("ink")}
      {children("fill")}
    </>
  );
}

// Clip ids come from the clip's own geometry rather than React's useId, so
// the walker is a pure function of its appearance (it can be rendered to an
// SVG string for share images). Identical ids always mean identical shapes,
// so repeating them across walkers on one page is harmless.
function clipId(geometry: string) {
  let h = 5381;
  for (let i = 0; i < geometry.length; i++) h = ((h << 5) + h + geometry.charCodeAt(i)) | 0;
  return `wk-clip-${(h >>> 0).toString(36)}`;
}

// Content clipped to a shape given in the current frame.
function Clipped({ id, shape, children }: { id: string; shape: ReactNode; children: ReactNode }) {
  return (
    <>
      <clipPath id={id}>{shape}</clipPath>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
}

// Painted strokes for one surface, drawn in that surface's frame and clipped
// to `clip` (a path in the current frame). `offset` maps the surface frame
// into the current one, e.g. body units into a thigh's local frame.
function PaintLayer({
  surface,
  strokes,
  clip,
  offset,
  dim,
}: {
  surface: Surface;
  strokes: readonly Stroke[];
  clip: string;
  offset?: { x: number; y: number };
  dim?: boolean;
}) {
  if (!strokes.length) return null;
  const box = SURFACE_BOX[surface];
  return (
    <Clipped id={clipId(clip)} shape={<path d={clip} />}>
      <g
        transform={offset ? `translate(${-offset.x} ${-offset.y})` : undefined}
        opacity={dim ? 0.82 : undefined}
      >
        {strokes.map((s, i) => (
          <path
            key={i}
            d={strokePath(box, s.points)}
            fill="none"
            stroke={s.color}
            strokeWidth={s.size}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>
    </Clipped>
  );
}

type Colors = {
  skin: string;
  top: string;
  bottom: string;
  shoe: string;
  sole: string;
  gloves?: string;
};

// How a limb joint moves: animated by the shared CSS walk cycle (default),
// held in the standing rest pose, or frozen at one computed frame (for
// static images, where CSS animations don't run).
type Motion = undefined | "rest" | GaitPose;
type Joint = "thigh" | "knee" | "foot" | "shoulder" | "elbow";

function joint(motion: Motion, name: Joint) {
  if (motion === undefined) return { className: `wk-a wk-${name}` };
  if (motion === "rest") return {};
  return { transform: `rotate(${motion[name].toFixed(2)})` };
}

export function Shoe({ pass, a, c, dim }: { pass: Pass; a: WalkerAppearance; c: Colors; dim?: boolean }) {
  const shoe = SHOES[a.shoes];
  if (pass === "ink") return <Shape pass="ink" d={shoe.outline} color={c.shoe} />;
  const fills = { shoe: c.shoe, skin: c.skin, sole: c.sole };
  return (
    <>
      {shoe.layers.map((l, i) => (
        <Outlined key={i} d={l.d} color={fills[l.fill]} />
      ))}
      <PaintLayer surface="shoes" strokes={a.paint.shoes} clip={shoe.outline} dim={dim} />
    </>
  );
}

const THIGH_OFFSET = { x: RIG.hip.x, y: RIG.hip.y };
const SHIN_OFFSET = { x: RIG.hip.x, y: RIG.hip.y + RIG.thigh };

function Leg({ pass, c, a, motion, dim }: { pass: Pass; c: Colors; a: WalkerAppearance; motion?: Motion; dim?: boolean }) {
  const b = a.bottom;
  const paint = a.paint.bottom;
  const fill = pass === "fill";
  const thighCloth = b === "trousers" || b === "cropped";
  return (
    <g transform={`translate(${RIG.hip.x} ${RIG.hip.y})`}>
      <g {...joint(motion, "thigh")}>
        <Seg pass={pass} len={RIG.thigh} w={LIMB.thigh} color={thighCloth ? c.bottom : c.skin} />
        {fill && b === "shorts" && <Outlined d={SHORTS} color={c.bottom} />}
        {fill && (thighCloth || b === "shorts") && (
          <PaintLayer surface="bottom" strokes={paint} clip={b === "shorts" ? SHORTS : THIGH_CLIP} offset={THIGH_OFFSET} dim={dim} />
        )}
        <g transform={`translate(0 ${RIG.thigh})`}>
          <g {...joint(motion, "knee")}>
            <Seg pass={pass} len={RIG.shin} w={LIMB.shin} color={b === "trousers" ? c.bottom : c.skin} />
            {fill && b === "cropped" && <Outlined d={CROPPED} color={c.bottom} />}
            {fill && (b === "trousers" || b === "cropped") && (
              <PaintLayer
                surface="bottom"
                strokes={paint}
                clip={b === "cropped" ? CROPPED : SHIN_CLIP}
                offset={SHIN_OFFSET}
                dim={dim}
              />
            )}
            <g transform={`translate(0 ${RIG.shin})`}>
              <g {...joint(motion, "foot")}>
                <Shoe pass={pass} a={a} c={c} dim={dim} />
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

function Arm({ pass, c, a, near, motion }: { pass: Pass; c: Colors; a: WalkerAppearance; near: boolean; motion?: Motion }) {
  const long = a.top === "longsleeve" || a.top === "hoodie";
  const fill = pass === "fill";
  const { bracelet, watch, gloves, ring } = a.extras;
  return (
    <g transform={`translate(${RIG.shoulder.x} ${RIG.shoulder.y})`}>
      <g {...joint(motion, "shoulder")}>
        <Seg pass={pass} len={RIG.upperArm} w={LIMB.upperArm} color={long ? c.top : c.skin} />
        {fill && a.top === "tee" && <Outlined d={TEE_SLEEVE} color={c.top} />}
        <g transform={`translate(0 ${RIG.upperArm})`}>
          <g {...joint(motion, "elbow")}>
            <Seg pass={pass} len={RIG.forearm} w={LIMB.forearm} color={long ? c.top : c.skin} />
            <Shape pass={pass} d={circle(0, RIG.forearm + 2, LIMB.hand)} color={c.gloves ?? c.skin} />
            {fill && gloves && <Outlined d={EXTRA_PATHS.glovesCuff} color={c.gloves ?? gloves} />}
            {fill && near && watch && (
              <>
                <Outlined d={EXTRA_PATHS.watchStrap} color={watch} />
                <Outlined d={EXTRA_PATHS.watchFace} color={SOLE_COLOR} />
              </>
            )}
            {fill && near && bracelet && <Outlined d={EXTRA_PATHS.bracelet} color={bracelet} />}
            {fill && near && ring && <Outlined d={EXTRA_PATHS.ring} color={ring} />}
          </g>
        </g>
      </g>
    </g>
  );
}

function Items({ layers, color }: { layers: readonly ItemLayer[]; color: string }) {
  const fills = { color, dark: "#1e1d1c", glass: "rgba(255,255,255,0.28)", none: "none" };
  return layers.map((layer, i) => (
    <path
      key={i}
      d={layer.d}
      fill={fills[layer.fill]}
      stroke={layer.stroke === "color" ? color : LINE}
      strokeWidth={layer.width ?? OUT}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  ));
}

function FaceFeatures({ a }: { a: WalkerAppearance }) {
  const face = a.face;
  const line = { fill: "none", stroke: INK, strokeWidth: 1.3, strokeLinecap: "round" as const };
  const fh = a.facialHair === "none" ? null : FACIAL_HAIR_PATHS[a.facialHair];
  const hairProps = fh?.faint
    ? { fill: a.hairColor, opacity: 0.38 }
    : { fill: a.hairColor, stroke: INK, strokeWidth: 1.1, strokeLinejoin: "round" as const };
  return (
    <>
      {face.blush && <circle cx={BLUSH.cx} cy={BLUSH.cy} r={BLUSH.r} fill={BLUSH.color} opacity={0.55} />}
      {fh?.beard && <path d={fh.beard} {...hairProps} />}
      {fh?.moustache && <path d={fh.moustache} {...hairProps} />}
      {face.eyes === "dot" && <circle {...EYES.dot} fill={INK} />}
      {face.eyes === "wide" && (
        <>
          <circle cx={EYES.wide.cx} cy={EYES.wide.cy} r={EYES.wide.r} fill="#fff" stroke={INK} strokeWidth={0.9} />
          <circle {...EYES.wide.pupil} fill={INK} />
        </>
      )}
      {face.eyes === "closed" && <path d={EYES.closed} {...line} />}
      {face.brows !== "none" && <path d={BROWS[face.brows]} {...line} strokeWidth={1.4} />}
      {face.mouth === "open" && <path d={MOUTHS.open} fill={INK} />}
      {(face.mouth === "smile" || face.mouth === "line") && <path d={MOUTHS[face.mouth]} {...line} />}
    </>
  );
}

const HEAD_SHAPE = (
  <>
    <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} />
    <circle cx={NOSE.x} cy={NOSE.y} r={NOSE.r} />
  </>
);
const HEAD_OUTLINE = `${circle(HEAD.x, HEAD.y, HEAD.r)}${circle(NOSE.x, NOSE.y, NOSE.r)}`;

function Hair({ a }: { a: WalkerAppearance }) {
  const clip = HAIR_CLIP[a.headwear];
  const shapes = (clip && HAIR_UNDER_HAT[a.hair]) || HAIR[a.hair];
  const layers = shapes.map((l, i) =>
    l.faint ? (
      <path key={i} d={l.d} fill={a.hairColor} opacity={0.4} />
    ) : (
      <Outlined key={i} d={l.d} color={a.hairColor} />
    ),
  );
  return clip ? (
    <Clipped id={clipId(clip)} shape={<path d={clip} />}>
      {layers}
    </Clipped>
  ) : (
    layers
  );
}

// The head with hair, face, paint and headwear, in the head's own frame.
// Shared by the walker and the editors so painting happens on the same head.
export function HeadParts({ a }: { a: WalkerAppearance }) {
  return (
    <>
      <Passes>{(pass) => <Shape pass={pass} d={HEAD_OUTLINE} color={a.skin} />}</Passes>
      <Clipped id="wk-clip-head" shape={HEAD_SHAPE}>
        <FaceFeatures a={a} />
      </Clipped>
      <Hair a={a} />
      {/* Painted strokes sit above the hair so what you paint is what you
          see, but stay clipped to the head. */}
      <PaintLayer surface="face" strokes={a.paint.face} clip={HEAD_OUTLINE} />
      <Items layers={EYEWEAR_LAYERS[a.eyewear]} color={a.eyewearColor} />
      <Items layers={HEADWEAR_LAYERS[a.headwear]} color={a.headwearColor} />
    </>
  );
}

// Neck, torso, hood and anything worn on the chest, in the (unleaned) torso frame.
export function TorsoParts({ a }: { a: WalkerAppearance }) {
  const { necklace, backpack } = a.extras;
  const seatPaint = a.bottom !== "skirt";
  return (
    <>
      <Passes>{(pass) => <Shape pass={pass} d={NECK} color={a.skin} />}</Passes>
      <Passes>
        {(pass) => (
          <>
            <Shape pass={pass} d={TORSO_SEAT} color={a.bottomColor} />
            <Shape pass={pass} d={TORSO_TOP} color={a.topColor} />
          </>
        )}
      </Passes>
      {seatPaint && <PaintLayer surface="bottom" strokes={a.paint.bottom} clip={TORSO_SEAT} />}
      <PaintLayer surface="top" strokes={a.paint.top} clip={TORSO_TOP} />
      <path d="M69 104L91 104" stroke={LINE} strokeWidth={OUT} strokeLinecap="round" />
      {a.top === "hoodie" && (
        <>
          <Outlined d={HOOD} color={a.topColor} />
          <path d={HOODIE_STRING} stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
        </>
      )}
      {necklace && (
        <>
          <path d={EXTRA_PATHS.necklace} fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
          <path d={EXTRA_PATHS.necklace} fill="none" stroke={necklace} strokeWidth={1} strokeLinecap="round" />
        </>
      )}
      {backpack && (
        <>
          <path d={EXTRA_PATHS.backpackStrap} fill="none" stroke={LINE} strokeWidth={4.6} strokeLinecap="round" />
          <path d={EXTRA_PATHS.backpackStrap} fill="none" stroke={backpack} strokeWidth={2.4} strokeLinecap="round" />
        </>
      )}
    </>
  );
}

function Skirt({ a }: { a: WalkerAppearance }) {
  return (
    <>
      <Outlined d={SKIRT} color={a.bottomColor} />
      <PaintLayer surface="bottom" strokes={a.paint.bottom} clip={SKIRT} />
    </>
  );
}

function colorsFor(a: WalkerAppearance, far: boolean): Colors {
  const d = (hex: string, amt = 0.12) => (far ? shade(hex, amt) : hex);
  return {
    skin: d(a.skin, 0.1),
    top: d(a.topColor),
    bottom: d(a.bottomColor),
    shoe: d(a.shoeColor),
    sole: d(SOLE_COLOR),
    gloves: a.extras.gloves && d(a.extras.gloves),
  };
}

// The near leg hanging straight with the hips and (if worn) the skirt, for
// painting trousers and skirts.
export function LegParts({ a }: { a: WalkerAppearance }) {
  const c = colorsFor(a, false);
  return (
    <>
      <Passes>{(pass) => <Shape pass={pass} d={TORSO_SEAT} color={a.bottomColor} />}</Passes>
      {a.bottom !== "skirt" && <PaintLayer surface="bottom" strokes={a.paint.bottom} clip={TORSO_SEAT} />}
      <Passes>{(pass) => <Leg pass={pass} c={c} a={a} motion="rest" />}</Passes>
      {a.bottom === "skirt" && <Skirt a={a} />}
    </>
  );
}

// A single shoe in its own frame, for painting shoes.
export function ShoeParts({ a }: { a: WalkerAppearance }) {
  const c = colorsFor(a, false);
  return (
    <Passes>
      {(pass) => (
        <>
          {/* A bit of shin so sandals and low shoes don't float. */}
          <Seg pass={pass} len={-14} w={LIMB.shin} color={a.bottom === "trousers" ? c.bottom : c.skin} />
          <Shoe pass={pass} a={a} c={c} />
        </>
      )}
    </Passes>
  );
}

const lean = `rotate(${RIG.lean} ${RIG.hip.x} ${RIG.hip.y})`;

export type WalkerProps = {
  appearance: WalkerAppearance;
  // Where in the walk cycle this walker starts, 0..1. Varying it keeps a
  // crowd from stepping in lockstep.
  phase?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
  // Freeze at this point of the walk cycle (0..1) with no CSS animation,
  // e.g. for share images. Omit to walk.
  frame?: number;
};

export function Walker({ appearance: a, phase = 0, height = 220, className, style, title, frame }: WalkerProps) {
  const nearPose = frame === undefined ? undefined : poseAt(frame);
  const farPose = frame === undefined ? undefined : poseAt(frame + 0.5);
  const near = colorsFor(a, false);
  const far = colorsFor(a, true);
  const { scarf, backpack } = a.extras;

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      width={(height * VIEWBOX.width) / VIEWBOX.height}
      height={height}
      className={className}
      style={{
        overflow: "visible",
        // Frozen frames are for images, where CSS variables don't resolve.
        color: frame === undefined ? `var(--wk-outline, ${INK})` : INK,
        ...style,
        ["--wk-phase" as string]: phase,
      }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {!nearPose && (
        <style href="walkers-walk-cycle" precedence="default">
          {WALK_CSS}
        </style>
      )}
      <g {...(nearPose ? { transform: `translate(0 ${nearPose.bob.toFixed(2)})` } : { className: "wk-a wk-bob" })}>
        <g className="wk-far">
          <g transform={lean}>
            <Passes>{(pass) => <Arm pass={pass} c={far} a={a} near={false} motion={farPose} />}</Passes>
          </g>
          <Passes>{(pass) => <Leg pass={pass} c={far} a={a} dim motion={farPose} />}</Passes>
        </g>

        <g transform={lean}>
          {scarf && <Outlined d={EXTRA_PATHS.scarfTail} color={scarf} />}
          {backpack && <Outlined d={EXTRA_PATHS.backpack} color={backpack} />}
          <TorsoParts a={a} />
        </g>

        <Passes>{(pass) => <Leg pass={pass} c={near} a={a} motion={nearPose} />}</Passes>

        <g transform={lean}>
          {a.bottom === "skirt" && <Skirt a={a} />}
          {scarf && <Outlined d={EXTRA_PATHS.scarfWrap} color={scarf} />}
          <HeadParts a={a} />
          <Passes>{(pass) => <Arm pass={pass} c={near} a={a} near motion={nearPose} />}</Passes>
        </g>
      </g>
    </svg>
  );
}
