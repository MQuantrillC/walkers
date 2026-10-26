import {
  BOTTOM_STYLES,
  BRUSH_SIZES,
  BROW_STYLES,
  DEFAULT_APPEARANCE,
  EXTRAS,
  EYEWEAR,
  EYE_STYLES,
  FACIAL_HAIR,
  HAIR_STYLES,
  HEADWEAR,
  MOUTH_STYLES,
  NAME_MAX,
  PAINT_LIMITS,
  PALETTE,
  SHOE_STYLES,
  SURFACES,
  TOP_PATTERNS,
  TOP_STYLES,
  type Face,
  type Paint,
  type Stroke,
  type Swatch,
  type WalkerAppearance,
} from "./appearance";

// Shared by the client (loading a saved draft) and, later, the server
// (accepting a save). `sanitize*` repairs what it can and falls back to
// defaults; `validate*` reports every problem and accepts nothing it had to fix.

type Issues = string[];

const hexes = (swatches: readonly Swatch[]) => new Set(swatches.map((s) => s.hex));
const SKIN = hexes(PALETTE.skin);
const HAIR = hexes(PALETTE.hair);
const CLOTH = hexes(PALETTE.cloth);
const PAINT_COLORS = hexes(PALETTE.paint);
const SIZES = new Set<number>(BRUSH_SIZES.map((b) => b.size));

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T, field: string, issues: Issues): T {
  if (typeof v === "string" && (allowed as readonly string[]).includes(v)) return v as T;
  issues.push(`${field} must be one of ${allowed.join(", ")}`);
  return fallback;
}

function color(v: unknown, allowed: Set<string>, fallback: string, field: string, issues: Issues): string {
  if (typeof v === "string" && allowed.has(v)) return v;
  issues.push(`${field} must be a palette colour`);
  return fallback;
}

// Fields added after launch: walkers saved before them simply don't have
// them, which isn't a problem, so a missing value quietly takes the default.
function later<T>(v: unknown, read: () => T, fallback: T): T {
  return v === undefined ? fallback : read();
}

function strokes(v: unknown, field: string, issues: Issues): Stroke[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) {
    issues.push(`${field} must be a list`);
    return [];
  }
  const out: Stroke[] = [];
  let total = 0;
  for (const [i, s] of v.entries()) {
    if (out.length >= PAINT_LIMITS.strokesPerSurface) {
      issues.push(`${field} is limited to ${PAINT_LIMITS.strokesPerSurface} strokes`);
      break;
    }
    if (!isRecord(s) || !Array.isArray(s.points)) {
      issues.push(`${field}[${i}] is malformed`);
      continue;
    }
    const pts = s.points;
    if (pts.length < 2 || pts.length % 2 !== 0 || pts.length / 2 > PAINT_LIMITS.pointsPerStroke) {
      issues.push(`${field}[${i}] has an invalid number of points`);
      continue;
    }
    if (!pts.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1)) {
      issues.push(`${field}[${i}] has points outside the surface`);
      continue;
    }
    if (total + pts.length / 2 > PAINT_LIMITS.pointsPerSurface) {
      issues.push(`${field} is limited to ${PAINT_LIMITS.pointsPerSurface} points`);
      break;
    }
    total += pts.length / 2;
    let size: number = BRUSH_SIZES[1].size;
    if (typeof s.size === "number" && SIZES.has(s.size)) size = s.size;
    else issues.push(`${field}[${i}].size is invalid`);
    out.push({
      color: color(s.color, PAINT_COLORS, PALETTE.paint[0].hex, `${field}[${i}].color`, issues),
      size,
      points: pts as number[],
    });
  }
  return out;
}

function paint(v: unknown, issues: Issues): Paint {
  if (!isRecord(v)) {
    issues.push("paint is missing");
    return DEFAULT_APPEARANCE.paint;
  }
  const out = Object.fromEntries(SURFACES.map((s) => [s, strokes(v[s], `paint.${s}`, issues)])) as Paint;
  // Across all surfaces, keep whole surfaces in order until the total is used.
  let total = 0;
  for (const s of SURFACES) {
    const n = out[s].reduce((sum, st) => sum + st.points.length / 2, 0);
    if (total + n > PAINT_LIMITS.pointsTotal) {
      issues.push(`paint is limited to ${PAINT_LIMITS.pointsTotal} points in total`);
      out[s] = [];
    } else {
      total += n;
    }
  }
  return out;
}

function extras(v: unknown, issues: Issues): WalkerAppearance["extras"] {
  if (!isRecord(v)) {
    issues.push("extras must be an object");
    return {};
  }
  const out: WalkerAppearance["extras"] = {};
  for (const [key, value] of Object.entries(v)) {
    if (!(EXTRAS as readonly string[]).includes(key)) {
      issues.push(`extras.${key} is not a known extra`);
      continue;
    }
    if (typeof value === "string" && CLOTH.has(value)) out[key as keyof typeof out] = value;
    else issues.push(`extras.${key} must be a palette colour`);
  }
  return out;
}

function face(v: unknown, issues: Issues): Face {
  const d = DEFAULT_APPEARANCE.face;
  if (!isRecord(v)) {
    issues.push("face is missing");
    return d;
  }
  if (typeof v.blush !== "boolean") issues.push("face.blush must be true or false");
  if (v.freckles !== undefined && typeof v.freckles !== "boolean") issues.push("face.freckles must be true or false");
  return {
    eyes: pick(v.eyes, EYE_STYLES, d.eyes, "face.eyes", issues),
    brows: pick(v.brows, BROW_STYLES, d.brows, "face.brows", issues),
    mouth: pick(v.mouth, MOUTH_STYLES, d.mouth, "face.mouth", issues),
    blush: typeof v.blush === "boolean" ? v.blush : d.blush,
    freckles: typeof v.freckles === "boolean" ? v.freckles : d.freckles,
  };
}

function appearance(v: unknown, issues: Issues): WalkerAppearance {
  const d = DEFAULT_APPEARANCE;
  if (!isRecord(v)) {
    issues.push("appearance is missing");
    return d;
  }
  return {
    skin: color(v.skin, SKIN, d.skin, "skin", issues),
    hair: pick(v.hair, HAIR_STYLES, d.hair, "hair", issues),
    hairColor: color(v.hairColor, HAIR, d.hairColor, "hairColor", issues),
    facialHair: pick(v.facialHair, FACIAL_HAIR, d.facialHair, "facialHair", issues),
    top: pick(v.top, TOP_STYLES, d.top, "top", issues),
    topColor: color(v.topColor, CLOTH, d.topColor, "topColor", issues),
    topPattern: later(v.topPattern, () => pick(v.topPattern, TOP_PATTERNS, d.topPattern, "topPattern", issues), d.topPattern),
    topPatternColor: later(
      v.topPatternColor,
      () => color(v.topPatternColor, CLOTH, d.topPatternColor, "topPatternColor", issues),
      d.topPatternColor,
    ),
    bottom: pick(v.bottom, BOTTOM_STYLES, d.bottom, "bottom", issues),
    bottomColor: color(v.bottomColor, CLOTH, d.bottomColor, "bottomColor", issues),
    shoes: pick(v.shoes, SHOE_STYLES, d.shoes, "shoes", issues),
    shoeColor: color(v.shoeColor, CLOTH, d.shoeColor, "shoeColor", issues),
    headwear: pick(v.headwear, HEADWEAR, d.headwear, "headwear", issues),
    headwearColor: color(v.headwearColor, CLOTH, d.headwearColor, "headwearColor", issues),
    eyewear: pick(v.eyewear, EYEWEAR, d.eyewear, "eyewear", issues),
    eyewearColor: color(v.eyewearColor, CLOTH, d.eyewearColor, "eyewearColor", issues),
    extras: extras(v.extras, issues),
    face: face(v.face, issues),
    paint: paint(v.paint, issues),
  };
}

export function sanitizeAppearance(v: unknown): WalkerAppearance {
  return appearance(v, []);
}

export function validateAppearance(v: unknown): { ok: true; value: WalkerAppearance } | { ok: false; issues: Issues } {
  const issues: Issues = [];
  const value = appearance(v, issues);
  return issues.length ? { ok: false, issues } : { ok: true, value };
}

// Trims and collapses whitespace, strips control characters and caps length.
export function cleanDisplayName(v: unknown): string {
  if (typeof v !== "string") return "";
  return v
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NAME_MAX);
}

export function validateDisplayName(v: unknown): { ok: true; value: string } | { ok: false; issue: "empty" | "tooLong" } {
  const value = cleanDisplayName(v);
  if (!value) return { ok: false, issue: "empty" };
  if (typeof v === "string" && v.trim().length > NAME_MAX) return { ok: false, issue: "tooLong" };
  return { ok: true, value };
}
