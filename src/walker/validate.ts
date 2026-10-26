import {
  ACCESSORIES,
  BOTTOM_STYLES,
  BRUSH_SIZES,
  BROW_STYLES,
  DEFAULT_APPEARANCE,
  EYE_STYLES,
  FACE_LIMITS,
  HAIR_STYLES,
  MOUTH_STYLES,
  NAME_MAX,
  PALETTE,
  SHOE_STYLES,
  TOP_STYLES,
  type Face,
  type FaceStroke,
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
const FACE_COLORS = hexes(PALETTE.face);
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

function strokes(v: unknown, issues: Issues): FaceStroke[] {
  if (!Array.isArray(v)) {
    issues.push("face.strokes must be a list");
    return [];
  }
  const out: FaceStroke[] = [];
  let total = 0;
  for (const [i, s] of v.entries()) {
    if (out.length >= FACE_LIMITS.strokes) {
      issues.push(`face drawings are limited to ${FACE_LIMITS.strokes} strokes`);
      break;
    }
    if (!isRecord(s) || !Array.isArray(s.points)) {
      issues.push(`face.strokes[${i}] is malformed`);
      continue;
    }
    const pts = s.points;
    if (pts.length < 2 || pts.length % 2 !== 0 || pts.length / 2 > FACE_LIMITS.pointsPerStroke) {
      issues.push(`face.strokes[${i}] has an invalid number of points`);
      continue;
    }
    if (!pts.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1)) {
      issues.push(`face.strokes[${i}] has points outside the head`);
      continue;
    }
    if (total + pts.length / 2 > FACE_LIMITS.totalPoints) {
      issues.push(`face drawings are limited to ${FACE_LIMITS.totalPoints} points`);
      break;
    }
    total += pts.length / 2;
    let size: number = BRUSH_SIZES[1].size;
    if (typeof s.size === "number" && SIZES.has(s.size)) size = s.size;
    else issues.push(`face.strokes[${i}].size is invalid`);
    out.push({
      color: color(s.color, FACE_COLORS, PALETTE.face[0].hex, `face.strokes[${i}].color`, issues),
      size,
      points: pts as number[],
    });
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
  return {
    eyes: pick(v.eyes, EYE_STYLES, d.eyes, "face.eyes", issues),
    brows: pick(v.brows, BROW_STYLES, d.brows, "face.brows", issues),
    mouth: pick(v.mouth, MOUTH_STYLES, d.mouth, "face.mouth", issues),
    blush: typeof v.blush === "boolean" ? v.blush : d.blush,
    strokes: strokes(v.strokes, issues),
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
    top: pick(v.top, TOP_STYLES, d.top, "top", issues),
    topColor: color(v.topColor, CLOTH, d.topColor, "topColor", issues),
    bottom: pick(v.bottom, BOTTOM_STYLES, d.bottom, "bottom", issues),
    bottomColor: color(v.bottomColor, CLOTH, d.bottomColor, "bottomColor", issues),
    shoes: pick(v.shoes, SHOE_STYLES, d.shoes, "shoes", issues),
    shoeColor: color(v.shoeColor, CLOTH, d.shoeColor, "shoeColor", issues),
    accessory: pick(v.accessory, ACCESSORIES, d.accessory, "accessory", issues),
    accessoryColor: color(v.accessoryColor, CLOTH, d.accessoryColor, "accessoryColor", issues),
    face: face(v.face, issues),
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

export function validateDisplayName(v: unknown): { ok: true; value: string } | { ok: false; issue: string } {
  const value = cleanDisplayName(v);
  if (!value) return { ok: false, issue: "Give your walker a name" };
  if (typeof v === "string" && v.trim().length > NAME_MAX) {
    return { ok: false, issue: `Names can be up to ${NAME_MAX} characters` };
  }
  return { ok: true, value };
}
