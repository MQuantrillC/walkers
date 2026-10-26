import { useId, type CSSProperties, type ReactNode } from "react";
import { RIG } from "./gait";
import { INK, type FaceStroke, type WalkerAppearance } from "./appearance";
import { VIEWBOX, WALK_CSS } from "./walkCss";
import { HEAD, HEAD_BOX, NOSE, strokePath } from "./face";
import {
  ACCESSORY_LAYERS,
  BLUSH,
  BROWS,
  EYES,
  HAIR,
  MOUTHS,
  NECK,
  SHOES,
  SHORTS,
  SKIRT,
  TEE_SLEEVE,
  TORSO_SEAT,
  TORSO_TOP,
  circle,
} from "./parts";

// Outline thickness. Overlapping limb segments are drawn in two passes, all
// ink first and then all fills, so a limb reads as one continuous shape.
const OUT = 2.2;

type Pass = "ink" | "fill";

const W = { thigh: 17, shin: 13, upperArm: 10, forearm: 9, hand: 5.5 };

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
      stroke={pass === "ink" ? INK : color}
      strokeWidth={pass === "ink" ? w + 2 * OUT : w}
      strokeLinecap="round"
    />
  );
}

// A shape that joins the limb outline (no edge drawn inside the union).
function Shape({ pass, d, color }: { pass: Pass; d: string; color: string }) {
  return pass === "ink" ? (
    <path d={d} fill={INK} stroke={INK} strokeWidth={2 * OUT} strokeLinejoin="round" />
  ) : (
    <path d={d} fill={color} />
  );
}

// A shape with its own complete outline, drawn over whatever is beneath it.
function Outlined({ d, color }: { d: string; color: string }) {
  return <path d={d} fill={color} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />;
}

type Colors = {
  skin: string;
  top: string;
  bottom: string;
  shoe: string;
};

function Leg({ pass, c, a }: { pass: Pass; c: Colors; a: WalkerAppearance }) {
  const covered = a.bottom === "trousers";
  const shoe = SHOES[a.shoes];
  return (
    <g transform={`translate(${RIG.hip.x} ${RIG.hip.y})`}>
      <g className="wk-a wk-thigh">
        <Seg pass={pass} len={RIG.thigh} w={W.thigh} color={covered ? c.bottom : c.skin} />
        {pass === "fill" && a.bottom === "shorts" && <Outlined d={SHORTS} color={c.bottom} />}
        <g transform={`translate(0 ${RIG.thigh})`}>
          <g className="wk-a wk-knee">
            <Seg pass={pass} len={RIG.shin} w={W.shin} color={covered ? c.bottom : c.skin} />
            <g transform={`translate(0 ${RIG.shin})`}>
              <g className="wk-a wk-foot">
                {pass === "ink" ? <Shape pass="ink" d={shoe} color={c.shoe} /> : <Outlined d={shoe} color={c.shoe} />}
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

function Arm({ pass, c, a }: { pass: Pass; c: Colors; a: WalkerAppearance }) {
  const long = a.top === "longsleeve";
  return (
    <g transform={`translate(${RIG.shoulder.x} ${RIG.shoulder.y})`}>
      <g className="wk-a wk-shoulder">
        <Seg pass={pass} len={RIG.upperArm} w={W.upperArm} color={long ? c.top : c.skin} />
        {pass === "fill" && a.top === "tee" && <Outlined d={TEE_SLEEVE} color={c.top} />}
        <g transform={`translate(0 ${RIG.upperArm})`}>
          <g className="wk-a wk-elbow">
            <Seg pass={pass} len={RIG.forearm} w={W.forearm} color={long ? c.top : c.skin} />
            <Shape pass={pass} d={circle(0, RIG.forearm + 2, W.hand)} color={c.skin} />
          </g>
        </g>
      </g>
    </g>
  );
}

function Passes({ children }: { children: (pass: Pass) => ReactNode }) {
  return (
    <>
      {children("ink")}
      {children("fill")}
    </>
  );
}

function FaceFeatures({ face }: { face: WalkerAppearance["face"] }) {
  const line = { fill: "none", stroke: INK, strokeWidth: 1.3, strokeLinecap: "round" as const };
  return (
    <>
      {face.blush && <circle cx={BLUSH.cx} cy={BLUSH.cy} r={BLUSH.r} fill={BLUSH.color} opacity={0.55} />}
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

export function FaceStrokes({ strokes }: { strokes: readonly FaceStroke[] }) {
  return strokes.map((s, i) => (
    <path
      key={i}
      d={strokePath(s.points)}
      fill="none"
      stroke={s.color}
      strokeWidth={s.size * HEAD_BOX.size}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ));
}

function Accessory({ a }: { a: WalkerAppearance }) {
  const fills = { color: a.accessoryColor, dark: "#1e1d1c", glass: "rgba(255,255,255,0.28)", none: "none" };
  return ACCESSORY_LAYERS[a.accessory].map((layer, i) => (
    <path
      key={i}
      d={layer.d}
      fill={fills[layer.fill]}
      stroke={layer.stroke === "color" ? a.accessoryColor : INK}
      strokeWidth={layer.width ?? OUT}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  ));
}

// The head with hair, face and accessory, in the head's own frame. Shared by
// the walker and the face editor so drawing happens on the exact same head.
// `drawing` renders extra strokes (e.g. one in progress) inside the face clip.
export function HeadParts({ a, drawing }: { a: WalkerAppearance; drawing?: ReactNode }) {
  const clipId = `wk-face-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <>
      <clipPath id={clipId}>
        <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} />
        <circle cx={NOSE.x} cy={NOSE.y} r={NOSE.r} />
      </clipPath>
      <Passes>
        {(pass) => (
          <>
            <Shape pass={pass} d={circle(HEAD.x, HEAD.y, HEAD.r)} color={a.skin} />
            <Shape pass={pass} d={circle(NOSE.x, NOSE.y, NOSE.r)} color={a.skin} />
          </>
        )}
      </Passes>
      <g clipPath={`url(#${clipId})`}>
        <FaceFeatures face={a.face} />
      </g>
      {HAIR[a.hair].map((d, i) => (
        <Outlined key={i} d={d} color={a.hairColor} />
      ))}
      {/* Drawn strokes sit above the hair so what you draw is always what you
          see, but stay clipped to the head. */}
      <g clipPath={`url(#${clipId})`}>
        <FaceStrokes strokes={a.face.strokes} />
        {drawing}
      </g>
      <Accessory a={a} />
    </>
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
};

export function Walker({ appearance: a, phase = 0, height = 220, className, style, title }: WalkerProps) {
  const near: Colors = { skin: a.skin, top: a.topColor, bottom: a.bottomColor, shoe: a.shoeColor };
  const far: Colors = {
    skin: shade(a.skin, 0.1),
    top: shade(a.topColor, 0.12),
    bottom: shade(a.bottomColor, 0.12),
    shoe: shade(a.shoeColor, 0.12),
  };

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      width={(height * VIEWBOX.width) / VIEWBOX.height}
      height={height}
      className={className}
      style={{ overflow: "visible", ...style, ["--wk-phase" as string]: phase }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <style href="walkers-walk-cycle" precedence="default">
        {WALK_CSS}
      </style>
      <g className="wk-a wk-bob">
        <g className="wk-far">
          <g transform={lean}>
            <Passes>{(pass) => <Arm pass={pass} c={far} a={a} />}</Passes>
          </g>
          <Passes>{(pass) => <Leg pass={pass} c={far} a={a} />}</Passes>
        </g>

        <g transform={lean}>
          <Passes>{(pass) => <Shape pass={pass} d={NECK} color={a.skin} />}</Passes>
          <Passes>
            {(pass) => (
              <>
                <Shape pass={pass} d={TORSO_SEAT} color={a.bottomColor} />
                <Shape pass={pass} d={TORSO_TOP} color={a.topColor} />
              </>
            )}
          </Passes>
          <path d="M69 104L91 104" stroke={INK} strokeWidth={OUT} strokeLinecap="round" />
        </g>

        <Passes>{(pass) => <Leg pass={pass} c={near} a={a} />}</Passes>

        <g transform={lean}>
          {a.bottom === "skirt" && <Outlined d={SKIRT} color={a.bottomColor} />}
          <HeadParts a={a} />
          <Passes>{(pass) => <Arm pass={pass} c={near} a={a} />}</Passes>
        </g>
      </g>
    </svg>
  );
}
