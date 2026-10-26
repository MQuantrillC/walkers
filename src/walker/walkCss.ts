import { GAIT, sampleCycle, type GaitPose } from "./gait";

// Default cycle length. Walking pace is tied to this through GAIT.stride.
export const WALK_DURATION_S = 1.2;

// Ground speed in px/s for a walker rendered `heightPx` tall. Anything that
// moves walkers horizontally must use this or their feet will slide.
export function walkSpeedPx(heightPx: number, durationS = WALK_DURATION_S) {
  return (GAIT.stride * (heightPx / VIEWBOX.height)) / durationS;
}

export const VIEWBOX = { width: 160, height: 220 } as const;

const fmt = (n: number) => (Math.abs(n) < 5e-4 ? "0" : n.toFixed(3).replace(/\.?0+$/, ""));

function keyframes(name: string, poses: GaitPose[], value: (p: GaitPose) => string) {
  const frames = poses.map((pose, i) => `${fmt((i / poses.length) * 100)}%{transform:${value(pose)}}`);
  // Closing frame repeats the first so the loop has no seam.
  frames.push(`100%{transform:${value(poses[0])}}`);
  return `@keyframes ${name}{${frames.join("")}}`;
}

// Built once at module load and shared by every walker on the page. Each
// walker sets --wk-phase (0..1) to offset its cycle; far-side limbs run half
// a cycle behind the near side.
export const WALK_CSS = (() => {
  const poses = sampleCycle();
  const rot = (k: "thigh" | "knee" | "foot" | "shoulder" | "elbow") => (p: GaitPose) =>
    `rotate(${fmt(p[k])}deg)`;
  const dur = `var(--wk-dur,${WALK_DURATION_S}s)`;
  return [
    keyframes("wk-thigh", poses, rot("thigh")),
    keyframes("wk-knee", poses, rot("knee")),
    keyframes("wk-foot", poses, rot("foot")),
    keyframes("wk-shoulder", poses, rot("shoulder")),
    keyframes("wk-elbow", poses, rot("elbow")),
    keyframes("wk-bob", poses, (p) => `translateY(${fmt(p.bob)}px)`),
    `.wk-a{transform-box:view-box;transform-origin:0 0;animation-duration:${dur};animation-timing-function:linear;animation-iteration-count:infinite;animation-play-state:var(--wk-play,running);animation-delay:calc(var(--wk-phase,0) * ${dur} * -1)}`,
    `.wk-far .wk-a{animation-delay:calc((var(--wk-phase,0) + .5) * ${dur} * -1)}`,
    `.wk-thigh{animation-name:wk-thigh}.wk-knee{animation-name:wk-knee}.wk-foot{animation-name:wk-foot}`,
    `.wk-shoulder{animation-name:wk-shoulder}.wk-elbow{animation-name:wk-elbow}.wk-bob{animation-name:wk-bob}`,
    // Reduced motion: hold each walker mid-stride at its own phase.
    `@media (prefers-reduced-motion:reduce){.wk-a{animation-play-state:paused}}`,
  ].join("\n");
})();
