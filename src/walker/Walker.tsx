import type { CSSProperties, ReactNode } from "react";
import { RIG } from "./gait";
import { PALETTE, type WalkerAppearance } from "./appearance";
import { VIEWBOX, WALK_CSS } from "./walkCss";

// Outline thickness. Overlapping limb segments are drawn in two passes, all
// ink first and then all fills, so a limb reads as one continuous shape.
const OUT = 2.2;
const INK = PALETTE.ink;

type Pass = "ink" | "fill";

const W = { thigh: 17, shin: 13, upperArm: 10, forearm: 9, hand: 5.5 };

const HEAD = { x: 83, y: 27, r: 15.5 };

function circle(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
}

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

const SHOE = "M-6 2C-6-1-3-2 0-2L3-2C6-1 9 1 13 2C17 3 20 5 20 6.5C20 7.6 19.2 8 18 8L-6 8Z";
const SHORTS = "M-10 21L-10 0A10 10 0 0 1 10 0L10 21Z";
const TEE_SLEEVE = "M-7 15L-7 0A7 7 0 0 1 7 0L7 15Z";

const TORSO_TOP =
  "M70 61C70 56.5 74 54 80 54C87 54 93 57 93.5 64L93 82C92.5 91 91.5 97 91 104L69 104C68 94 67.5 82 68 72C68.3 66 69 63 70 61Z";
const TORSO_SEAT =
  "M69 100L91 100C92.5 108 92.5 116 89.5 121C85.5 125.5 73 125.5 68.5 120.5C66 115 66.5 106 69 100Z";
const NECK = "M77 36L87 36L87 58L77 58Z";
const SKIRT = "M69 100L91 100C95 114 99 128 101 140C90 143 70 143 61 140C63 128 66 113 69 100Z";

const HAIR: Record<WalkerAppearance["hair"], string[]> = {
  short: [
    "M96 20C95 11 87 9 81 9.5C72 10 66 16 66.5 25C67 31 69 35 72 37L75 33C74 29 75 25 79 23C85 21 91 22 96 20Z",
  ],
  bob: [
    "M97 19C95 10 86 8 80 9C70 10 64.5 18 65 28C65.5 36 67 41 71 44L80 44C77 38 76 30 79 24C85 21 92 22 97 19Z",
  ],
  bun: [
    circle(70, 12, 6),
    "M96 20C95 11 87 9 81 9.5C72 10 66 16 66.5 25C67 31 69 35 72 37L75 33C74 29 75 25 79 23C85 21 91 22 96 20Z",
  ],
  long: [
    "M97 19C95 10 86 8 80 9C70 10 64 18 64 28L63 58C63 61 66 62 71 61L78 60C77 50 76 34 79 24C85 21 92 22 97 19Z",
  ],
  none: [],
};

type Colors = {
  skin: string;
  top: string;
  bottom: string;
  shoe: string;
};

function Leg({ pass, c, a }: { pass: Pass; c: Colors; a: WalkerAppearance }) {
  const covered = a.bottom === "trousers";
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
                {pass === "ink" ? <Shape pass="ink" d={SHOE} color={c.shoe} /> : <Outlined d={SHOE} color={c.shoe} />}
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
        {pass === "fill" && !long && <Outlined d={TEE_SLEEVE} color={c.top} />}
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
          <Passes>
            {(pass) => (
              <>
                <Shape pass={pass} d={circle(HEAD.x, HEAD.y, HEAD.r)} color={a.skin} />
                <Shape pass={pass} d={circle(HEAD.x + 15, HEAD.y + 3, 3.2)} color={a.skin} />
              </>
            )}
          </Passes>
          {HAIR[a.hair].map((d, i) => (
            <Outlined key={i} d={d} color={a.hairColor} />
          ))}
          <circle cx={HEAD.x + 9.5} cy={HEAD.y - 3} r={1.7} fill={INK} />
          <Passes>{(pass) => <Arm pass={pass} c={near} a={a} />}</Passes>
        </g>
      </g>
    </svg>
  );
}
