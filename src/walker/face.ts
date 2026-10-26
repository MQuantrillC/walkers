// Geometry for hand-drawn face strokes. Strokes live in "head-box"
// coordinates: 0..1 across the bounding square of the head circle, in the
// head's own (unleaned) frame, so they ride along with the head as it walks.

export const HEAD = { x: 83, y: 27, r: 15.5 } as const;
export const NOSE = { x: HEAD.x + 15, y: HEAD.y + 3, r: 3.2 } as const;

export const HEAD_BOX = {
  x: HEAD.x - HEAD.r,
  y: HEAD.y - HEAD.r,
  size: HEAD.r * 2,
} as const;

type Pt = { x: number; y: number };

export function toBox(x: number, y: number): Pt {
  return { x: (x - HEAD_BOX.x) / HEAD_BOX.size, y: (y - HEAD_BOX.y) / HEAD_BOX.size };
}

export function fromBox(u: number, v: number): Pt {
  return { x: HEAD_BOX.x + u * HEAD_BOX.size, y: HEAD_BOX.y + v * HEAD_BOX.size };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

// Smooth path through the points using midpoint quadratic curves. A single
// point becomes a dot (a tiny segment with round caps).
export function strokePath(points: readonly number[]): string {
  const n = points.length / 2;
  const p = (i: number) => fromBox(points[i * 2], points[i * 2 + 1]);
  const a = p(0);
  if (n === 1) return `M${r2(a.x)} ${r2(a.y)}l0.01 0`;
  let d = `M${r2(a.x)} ${r2(a.y)}`;
  for (let i = 1; i < n - 1; i++) {
    const c = p(i);
    const next = p(i + 1);
    d += `Q${r2(c.x)} ${r2(c.y)} ${r2((c.x + next.x) / 2)} ${r2((c.y + next.y) / 2)}`;
  }
  const last = p(n - 1);
  return `${d}L${r2(last.x)} ${r2(last.y)}`;
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Ramer–Douglas–Peucker on a flat point list; keeps endpoints.
export function simplify(points: readonly number[], tolerance = 0.004): number[] {
  const n = points.length / 2;
  if (n <= 2) return [...points];
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
    let worst = 0;
    let index = -1;
    for (let i = s + 1; i < e; i++) {
      const d = distToSegment(
        points[i * 2], points[i * 2 + 1],
        points[s * 2], points[s * 2 + 1],
        points[e * 2], points[e * 2 + 1],
      );
      if (d > worst) {
        worst = d;
        index = i;
      }
    }
    if (worst > tolerance && index > 0) {
      keep[index] = 1;
      stack.push([s, index], [index, e]);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(points[i * 2], points[i * 2 + 1]);
  return out;
}

// Closest distance from a point to a stroke's centre line, in box units.
export function distanceToStroke(points: readonly number[], u: number, v: number): number {
  const n = points.length / 2;
  if (n === 1) return Math.hypot(u - points[0], v - points[1]);
  let best = Infinity;
  for (let i = 0; i < n - 1; i++) {
    best = Math.min(
      best,
      distToSegment(u, v, points[i * 2], points[i * 2 + 1], points[i * 2 + 2], points[i * 2 + 3]),
    );
  }
  return best;
}

// Store at three decimals: plenty for a head drawn a few hundred px wide.
export const roundPoint = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 1000) / 1000;
