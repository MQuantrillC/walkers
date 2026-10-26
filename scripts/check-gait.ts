// Regression check for the walk cycle. Rebuilds the foot from the sampled
// joint angles (forward kinematics) and fails if a planted foot slides
// against the ground, the foot sinks into the ground, or the swing foot
// scuffs it. Run with: npm run check:gait
import { GAIT, RIG, poseAt } from "../src/walker/gait.ts";

const DEG = Math.PI / 180;
const rot = (p: { x: number; y: number }, d: number) => ({
  x: p.x * Math.cos(d * DEG) - p.y * Math.sin(d * DEG),
  y: p.x * Math.sin(d * DEG) + p.y * Math.cos(d * DEG),
});
const add = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: a.x + b.x, y: a.y + b.y });

function foot(p: number) {
  const pose = poseAt(p);
  const hip = { x: RIG.hip.x, y: RIG.hip.y + pose.bob };
  const knee = add(hip, rot({ x: 0, y: RIG.thigh }, pose.thigh));
  const ankle = add(knee, rot({ x: 0, y: RIG.shin }, pose.thigh + pose.knee));
  const angle = pose.thigh + pose.knee + pose.foot;
  return {
    heel: add(ankle, rot(RIG.heel, angle)),
    ball: add(ankle, rot(RIG.ball, angle)),
    toe: add(ankle, rot({ x: 19, y: 7 }, angle)),
  };
}

const N = 1200;
const onGround = (y: number) => y > RIG.groundY - 0.05;
let slide = 0;
let sink = 0;
let clearance = Infinity;
for (let i = 0; i < N; i++) {
  const a = foot(i / N);
  const b = foot((i + 1) / N);
  for (const k of ["heel", "ball"] as const) {
    if (onGround(a[k].y) && onGround(b[k].y)) {
      // A planted point should move back exactly as far as the ground does.
      slide = Math.max(slide, Math.abs(b[k].x - a[k].x + GAIT.stride / N));
    }
  }
  sink = Math.max(sink, a.heel.y - RIG.groundY, a.ball.y - RIG.groundY, a.toe.y - RIG.groundY);
  const q = i / N;
  if (q > GAIT.stance + 0.05 && q < 0.95) {
    clearance = Math.min(clearance, RIG.groundY - Math.max(a.heel.y, a.toe.y));
  }
}

const results = [
  { name: "planted foot slide per cycle", value: slide * N, limit: 0.1, ok: slide * N < 0.1 },
  { name: "deepest foot below ground", value: sink, limit: 1, ok: sink < 1 },
  { name: "lowest swing clearance", value: clearance, limit: 2, ok: clearance > 2 },
];
for (const r of results) {
  console.log(`${r.ok ? "ok  " : "FAIL"} ${r.name}: ${r.value.toFixed(3)} (limit ${r.limit})`);
}
if (results.some((r) => !r.ok)) process.exit(1);
