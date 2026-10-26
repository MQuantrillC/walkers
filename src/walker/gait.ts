// Procedural side-view walk cycle.
//
// Everything is in the walker's SVG units: viewBox 0 0 160 220, the figure
// faces +x and y points down. The cycle is solved once with inverse
// kinematics so the stance foot stays planted on ground that moves backwards
// at a constant speed, then sampled into CSS keyframes (see walkCss.ts).
//
// Rotation convention matches SVG/CSS: positive degrees turn clockwise on
// screen, so for a limb hanging straight down a negative rotation swings it
// forward (+x) and a positive one swings it back.
//
// This file has no imports so it can also run directly under Node for checks.

export const RIG = {
  groundY: 210,
  hip: { x: 80, y: 112 },
  thigh: 46,
  shin: 44,
  // Ankle sits this far above the sole when the foot is flat.
  ankleHeight: 8,
  // Foot-local contact points (ankle at origin, foot flat).
  heel: { x: -5, y: 8 },
  ball: { x: 16, y: 8 },
  shoulder: { x: 80, y: 64 },
  upperArm: 34,
  forearm: 32,
  // Constant forward lean of the upper body, in degrees.
  lean: 3,
} as const;

export const GAIT = {
  // Ground travelled per full cycle (two steps). The gallery must move a
  // walker by exactly this much per cycle or the feet will appear to slide.
  stride: 110,
  // Fraction of the cycle each foot spends on the ground (>0.5 gives double support).
  stance: 0.62,
  // Heel strike rolls onto a flat foot by this phase...
  footFlat: 0.1,
  // ...and the heel starts to peel off at this phase.
  heelOff: 0.34,
  strikeAngle: -20,
  toeOffAngle: 32,
  // Extra ankle clearance at mid-swing.
  swingLift: 9,
  // Vertical travel of the hips: lowest in double support, highest mid-stance.
  bob: 3.2,
  armSwing: 17,
  armLag: 0.03,
  elbowBase: 8,
  elbowSwing: 14,
  samples: 60,
} as const;

type Vec = { x: number; y: number };

export type GaitPose = {
  thigh: number;
  knee: number;
  foot: number;
  shoulder: number;
  elbow: number;
  // Vertical offset of the whole body from the standing rest pose.
  bob: number;
};

const DEG = 180 / Math.PI;
const TAU = Math.PI * 2;

function rotate(p: Vec, deg: number): Vec {
  const r = deg / DEG;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

function wrap(p: number) {
  return ((p % 1) + 1) % 1;
}

function easeInOut(u: number) {
  return 0.5 - 0.5 * Math.cos(Math.PI * u);
}

const L = GAIT.stride;
const B = GAIT.stance;
const heelToBall = RIG.ball.x - RIG.heel.x;

// Place the heel strike so the ankle travels symmetrically about the hip:
// as far in front at heel strike as it ends up behind at toe off.
const heelStrikeX = (() => {
  const strikeOffset = rotate(RIG.heel, GAIT.strikeAngle).x;
  const toeOffOffset = rotate(RIG.ball, GAIT.toeOffAngle).x;
  return (strikeOffset - heelToBall + L * B + toeOffOffset) / 2;
})();

type FootState = { ankle: Vec; angle: number };

// Foot pose while on the ground, q in [0, stance). Heel rocker, flat foot,
// then toe rocker, each keeping its contact point fixed to the moving ground.
function stanceFoot(q: number): FootState {
  const shift = L * q;
  const g = RIG.groundY;
  if (q < GAIT.footFlat) {
    const angle = GAIT.strikeAngle * (1 - easeInOut(q / GAIT.footFlat));
    const heel = { x: RIG.hip.x + heelStrikeX - shift, y: g };
    const o = rotate(RIG.heel, angle);
    return { ankle: { x: heel.x - o.x, y: heel.y - o.y }, angle };
  }
  if (q < GAIT.heelOff) {
    return {
      ankle: { x: RIG.hip.x + heelStrikeX - RIG.heel.x - shift, y: g - RIG.ankleHeight },
      angle: 0,
    };
  }
  const u = (q - GAIT.heelOff) / (B - GAIT.heelOff);
  const angle = GAIT.toeOffAngle * u * u;
  const ball = { x: RIG.hip.x + heelStrikeX + heelToBall - shift, y: g };
  const o = rotate(RIG.ball, angle);
  return { ankle: { x: ball.x - o.x, y: ball.y - o.y }, angle };
}

function hermite(p0: number, m0: number, p1: number, m1: number, u: number) {
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * p0 +
    (u3 - 2 * u2 + u) * m0 +
    (-2 * u3 + 3 * u2) * p1 +
    (u3 - u2) * m1
  );
}

// Swing endpoints and velocities, so the foot leaves and lands without a hitch.
const swing = (() => {
  const h = 1e-4;
  const off = stanceFoot(B - 1e-9);
  const offPrev = stanceFoot(B - h);
  const strike = stanceFoot(0);
  const strikeNext = stanceFoot(h);
  const span = 1 - B;
  return {
    off,
    strike,
    v0: {
      x: ((off.ankle.x - offPrev.ankle.x) / h) * span,
      y: ((off.ankle.y - offPrev.ankle.y) / h) * span,
      // Damped so the foot doesn't keep flicking up after toe off.
      a: ((off.angle - offPrev.angle) / h) * span * 0.5,
    },
    v1: {
      x: ((strikeNext.ankle.x - strike.ankle.x) / h) * span,
      y: ((strikeNext.ankle.y - strike.ankle.y) / h) * span,
      a: ((strikeNext.angle - strike.angle) / h) * span,
    },
  };
})();

function swingFoot(q: number): FootState {
  const u = (q - B) / (1 - B);
  const { off, strike, v0, v1 } = swing;
  const lift = GAIT.swingLift * Math.sin(Math.PI * Math.pow(u, 0.85));
  return {
    ankle: {
      x: hermite(off.ankle.x, v0.x, strike.ankle.x, v1.x, u),
      y: hermite(off.ankle.y, v0.y, strike.ankle.y, v1.y, u) - lift,
    },
    angle: hermite(off.angle, v0.a, strike.angle, v1.a, u),
  };
}

// Foot for the near leg at cycle phase p (heel strike at p = 0).
export function footAt(p: number): FootState {
  const q = wrap(p);
  return q < B ? stanceFoot(q) : swingFoot(q);
}

const reach = (RIG.thigh + RIG.shin) * 0.995;

// Lowest the hips must sit (largest y) so both ankles stay within reach.
function hipBound(p: number) {
  let y = -Infinity;
  for (const foot of [footAt(p), footAt(p + 0.5)]) {
    const dx = foot.ankle.x - RIG.hip.x;
    y = Math.max(y, foot.ankle.y - Math.sqrt(Math.max(reach * reach - dx * dx, 0)));
  }
  return y;
}

const hipCurve = (() => {
  let lowY = -Infinity;
  let lowP = 0;
  for (let i = 0; i < 400; i++) {
    const p = i / 400;
    const y = hipBound(p);
    if (y > lowY) {
      lowY = y;
      lowP = p;
    }
  }
  return { lowY, lowP };
})();

export function hipYAt(p: number) {
  const { lowY, lowP } = hipCurve;
  // Two dips per cycle, one per step.
  const smooth = lowY - (GAIT.bob * (1 - Math.cos(2 * TAU * (p - lowP)))) / 2;
  return Math.max(smooth, hipBound(p));
}

// Two-bone IK with the knee bending forward. Returns world directions in radians.
function solveLeg(hip: Vec, ankle: Vec) {
  const T = RIG.thigh;
  const S = RIG.shin;
  const dx = ankle.x - hip.x;
  const dy = ankle.y - hip.y;
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(T - S) + 1e-3), T + S - 1e-3);
  const toAnkle = Math.atan2(dy, dx);
  const atHip = Math.acos((T * T + d * d - S * S) / (2 * T * d));
  const atKnee = Math.acos((T * T + S * S - d * d) / (2 * T * S));
  const thighDir = toAnkle - atHip;
  const shinDir = thighDir + (Math.PI - atKnee);
  return { thighDir, shinDir };
}

// Full pose for the near-side limbs at phase p. The far side uses p + 0.5.
export function poseAt(p: number): GaitPose {
  const q = wrap(p);
  const hipY = hipYAt(q);
  const foot = footAt(q);
  const { thighDir, shinDir } = solveLeg({ x: RIG.hip.x, y: hipY }, foot.ankle);
  const thigh = thighDir * DEG - 90;
  const shinWorld = shinDir * DEG - 90;

  // Each arm swings against its own leg, reaching furthest back just after
  // that foot strikes. The elbow lags behind the shoulder.
  const armPhase = TAU * (q - GAIT.armLag);
  const shoulder = -RIG.lean - 2 + GAIT.armSwing * Math.cos(armPhase);
  const elbow = -(
    GAIT.elbowBase +
    GAIT.elbowSwing * (0.5 - 0.5 * Math.cos(armPhase - TAU * 0.08))
  );

  return {
    thigh,
    knee: shinWorld - thigh,
    foot: foot.angle - shinWorld,
    shoulder,
    elbow,
    bob: hipY - RIG.hip.y,
  };
}

export function sampleCycle(samples: number = GAIT.samples): GaitPose[] {
  return Array.from({ length: samples }, (_, i) => poseAt(i / samples));
}
