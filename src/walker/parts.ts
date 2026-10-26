import type { Extra, FacialHair, HairStyle, Headwear, ShoeStyle } from "./appearance";

// Path data for the original vector parts, in walker SVG units
// (viewBox 0 0 160 220, facing +x). Head parts are in the head's frame; the
// head circle is centred at (83, 27) with radius 15.5.

export const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

// A rounded bar hanging down from its joint (limb-local, along +y).
const capsule = (w: number, len: number) =>
  `M${-w / 2} 0A${w / 2} ${w / 2} 0 0 1 ${w / 2} 0L${w / 2} ${len}A${w / 2} ${w / 2} 0 0 1 ${-w / 2} ${len}Z`;
// Same, but cut square at `len` (a hem).
const sleeve = (w: number, len: number) => `M${-w / 2} ${len}L${-w / 2} 0A${w / 2} ${w / 2} 0 0 1 ${w / 2} 0L${w / 2} ${len}Z`;

export const LIMB = { thigh: 17, shin: 13, upperArm: 10, forearm: 9, hand: 5.5 } as const;

export const TORSO_TOP =
  "M70 61C70 56.5 74 54 80 54C87 54 93 57 93.5 64L93 82C92.5 91 91.5 97 91 104L69 104C68 94 67.5 82 68 72C68.3 66 69 63 70 61Z";
export const TORSO_SEAT =
  "M69 100L91 100C92.5 108 92.5 116 89.5 121C85.5 125.5 73 125.5 68.5 120.5C66 115 66.5 106 69 100Z";
export const NECK = "M77 36L87 36L87 58L77 58Z";
export const SKIRT = "M69 100L91 100C95 114 99 128 101 140C90 143 70 143 61 140C63 128 66 113 69 100Z";
export const HOOD = "M71 61C66.5 56 66 48 69.5 43.5C72 40.5 76 40 78.5 42L81 55Z";
export const HOODIE_STRING = "M88.5 56.5L90 67";

// Limb-local clothing overlays and paint clip shapes.
export const SHORTS = sleeve(20, 21);
export const CROPPED = sleeve(15, 26);
export const TEE_SLEEVE = sleeve(14, 15);
export const THIGH_CLIP = capsule(LIMB.thigh, 46);
export const SHIN_CLIP = capsule(LIMB.shin, 44);

// Foot-local shoes: ankle at the origin, sole along y = 8, toes towards +x.
// `outline` is the silhouette (used for the joined limb outline and as the
// paint clip); layers are drawn in order.
export type ShoeLayer = { d: string; fill: "shoe" | "skin" | "sole" };
const SOLE = "M-7 5.6L20.4 5.6L20.5 6.8C20.5 7.7 19.7 8 18.5 8L-7 8Z";
export const SHOES: Record<ShoeStyle, { outline: string; layers: ShoeLayer[] }> = {
  sneaker: {
    outline: "M-6 2C-6-1-3-2 0-2L3-2C6-1 9 1 13 2C17 3 20 5 20 6.5C20 7.6 19.2 8 18 8L-6 8Z",
    layers: [
      { d: "M-6 2C-6-1-3-2 0-2L3-2C6-1 9 1 13 2C17 3 20 5 20 6.5C20 7.6 19.2 8 18 8L-6 8Z", fill: "shoe" },
      { d: "M-6 5.6L19.9 5.6C20 5.9 20 6.2 20 6.5C20 7.6 19.2 8 18 8L-6 8Z", fill: "sole" },
    ],
  },
  hightop: {
    outline: "M-7-7L5-7L5 0C8 1 12 2 15.5 3C19 4 20.5 5.5 20.5 6.8C20.5 7.7 19.7 8 18.5 8L-7 8Z",
    layers: [
      { d: "M-7-7L5-7L5 0C8 1 12 2 15.5 3C19 4 20.5 5.5 20.5 6.8C20.5 7.7 19.7 8 18.5 8L-7 8Z", fill: "shoe" },
      { d: SOLE, fill: "sole" },
    ],
  },
  boot: {
    outline: "M-7.5-12L7-12L7 0C10 1 13 2 16 3C19 4 20.5 5.5 20.5 6.8C20.5 7.7 19.7 8 18.5 8L-7.5 8Z",
    layers: [
      { d: "M-7.5-12L7-12L7 0C10 1 13 2 16 3C19 4 20.5 5.5 20.5 6.8C20.5 7.7 19.7 8 18.5 8L-7.5 8Z", fill: "shoe" },
    ],
  },
  flat: {
    outline: "M-6 4C-6 2.5-4 2-1 2.5L4 3C9 3.2 14 3.6 17 4.5C19.3 5.2 20 6 20 6.8C20 7.7 19.2 8 18 8L-6 8Z",
    layers: [
      { d: "M-6 4C-6 2.5-4 2-1 2.5L4 3C9 3.2 14 3.6 17 4.5C19.3 5.2 20 6 20 6.8C20 7.7 19.2 8 18 8L-6 8Z", fill: "shoe" },
    ],
  },
  sandal: {
    outline: "M-6 3C-6 0-3-1.5 0-1.5C4-1.5 8 0.5 13 2.5C17 4 20 5.5 20 6.8C20 7.7 19.2 8 18 8L-6 8Z",
    layers: [
      { d: "M-5.5 3C-5.5 0-3-1.5 0-1.5C4-1.5 8 0.5 13 2.5C17 4 19.5 5.5 19.5 6.8L-5.5 6.8Z", fill: "skin" },
      { d: "M-6 5.8L19.9 5.8C20.2 7.2 19.5 8 18.3 8L-6 8Z", fill: "shoe" },
      { d: "M3.5-0.8L9.5 1.4L8.4 5.8L3.2 5.8Z", fill: "shoe" },
      { d: "M-6 0.5L-2.5 0.5L-2.5 5.8L-6 5.8Z", fill: "shoe" },
    ],
  },
};

const SHORT_HAIR =
  "M96 20C95 11 87 9 81 9.5C72 10 66 16 66.5 25C67 31 69 35 72 37L75 33C74 29 75 25 79 23C85 21 91 22 96 20Z";
const BUZZ =
  "M95 18C93 12.5 88 10.5 82 10.5C73.5 10.5 67.5 16 67.5 24.5C67.5 29 68.5 32.5 70.5 35L73.5 32.5C72.5 29.5 72.5 26.5 74 24C76.5 20.5 81 19.5 86 19.3C89.5 19.2 92.5 18.9 95 18Z";

// Hair layers in drawing order. `faint` layers are a soft tint with no
// outline (shaved sides, stubble).
export type HairLayer = { d: string; faint?: boolean };
export const HAIR: Record<HairStyle, HairLayer[]> = {
  short: [{ d: SHORT_HAIR }],
  buzz: [{ d: BUZZ }],
  quiff: [
    {
      d: "M99 15C100 8 95 3.5 87 4C80 4.5 75 7 71 11C67 15 66 21 66.5 26C67 31 69 35 72 37L75 33C74 29 75 25 79 23C85 21 91 21.5 96 20C98 19 99 17 99 15Z",
    },
  ],
  curly: [
    {
      d: "M97 17C98 12 95 8.5 91 8.5C89 5.5 84 5 81 7C77.5 5 72.5 6.5 71 10C67 10.5 64.5 14.5 65.5 18.5C62.5 21 62.5 26 65.5 28C63.5 31.5 65 36 68.5 37C69.5 40.5 73.5 41.5 76 39.5L77.5 34C75.5 30 76 25.5 79 23.5C84.5 21 91 21.5 97 17Z",
    },
  ],
  bob: [
    {
      d: "M97 19C95 10 86 8 80 9C70 10 64.5 18 65 28C65.5 36 67 41 71 44L80 44C77 38 76 30 79 24C85 21 92 22 97 19Z",
    },
  ],
  bun: [{ d: circle(70, 12, 6) }, { d: SHORT_HAIR }],
  ponytail: [{ d: "M69 17C61 18 57 27 58 40C58.5 45 62.5 46 64 42C63.5 34 65 27 71 22Z" }, { d: SHORT_HAIR }],
  braid: [
    { d: circle(65, 58.5, 2.6) },
    { d: circle(65.3, 53, 3.3) },
    { d: circle(66, 46.5, 3.7) },
    { d: circle(67.2, 40, 4) },
    { d: circle(68.6, 33.6, 4.2) },
    { d: SHORT_HAIR },
  ],
  long: [
    {
      d: "M97 19C95 10 86 8 80 9C70 10 64 18 64 28L63 58C63 61 66 62 71 61L78 60C77 50 76 34 79 24C85 21 92 22 97 19Z",
    },
  ],
  afro: [
    {
      d: "M97 18C99 7 91 0 80 0.5C66 1 57.5 10 58 23C58.5 34 63 41 70 43L76 36C75 30 76 25 80 23C86 21 92 21 97 18Z",
    },
  ],
  mohawk: [
    { d: BUZZ, faint: true },
    {
      d: "M95 16C95.5 9 92 2 85 0C78-1.5 70 3 67.5 11C66.5 15 66.5 19 67.5 22L71 20C72 16 75 13.5 80 13C86 12.5 91 14 95 16Z",
    },
  ],
  none: [],
};

// Hats hide whatever hair sits above their band; hair below it (an afro's
// sides, a braid, long hair) still shows. Everything below this line is kept.
export const UNDER_HAT = "M0 32.3L160 9.8L160 220L0 220Z";
export const HIDES_HAIR: Record<Headwear, boolean> = {
  none: false,
  cap: true,
  beanie: true,
  bucket: true,
  headband: false,
};

export const FACIAL_HAIR_PATHS: Record<Exclude<FacialHair, "none">, { beard?: string; moustache?: string; faint?: boolean }> = {
  stubble: {
    beard: "M79.5 30.5C79 37 83 42.5 90 43C95.5 43.3 99 40 99.5 34.5L96.8 33.6C96 36.5 93.8 38 91 37.7C87.5 37.3 85 35 84 31.5L81.5 29Z",
    moustache: "M92 33.2C93.5 31.6 96.5 31.4 98.6 32.8C98 34.2 95 34.6 92 33.2Z",
    faint: true,
  },
  moustache: {
    moustache: "M91.6 33.4C93.3 31.3 96.7 31.1 98.9 32.7C98.3 34.6 94.8 35.1 91.6 33.4Z",
  },
  beard: {
    beard: "M79.5 30.5C79 37 83 42.5 90 43C95.5 43.3 99 40 99.5 34.5L96.8 33.6C96 36.5 93.8 38 91 37.7C87.5 37.3 85 35 84 31.5L81.5 29Z",
    moustache: "M91.6 33.4C93.3 31.3 96.7 31.1 98.9 32.7C98.3 34.6 94.8 35.1 91.6 33.4Z",
  },
};

// Headwear and eyewear layers. `color` uses the item's colour, `dark` a
// near-black lens, `glass` a faint tint.
export type ItemLayer = { d: string; fill: "color" | "dark" | "glass" | "none"; stroke?: "color" | "ink"; width?: number };

export const HEADWEAR_LAYERS: Record<Headwear, ItemLayer[]> = {
  none: [],
  cap: [
    { d: "M66.5 23C66 13.5 72.5 7.5 82 7.5C91 7.5 97.2 12 97.5 18.5L66.5 23Z", fill: "color", stroke: "ink" },
    { d: "M95 16.8L108.5 18C109.7 18.1 109.7 20.1 108.5 20.2L95 19.9Z", fill: "color", stroke: "ink" },
  ],
  beanie: [
    { d: circle(81, 5, 3.6), fill: "color", stroke: "ink" },
    { d: "M66.5 21C66 12 72.5 5.5 82 5.5C91.5 5.5 98 11 98 17L66.5 21Z", fill: "color", stroke: "ink" },
    { d: "M65.5 24.5L98.5 19.5L98.3 15L66 19.6Z", fill: "color", stroke: "ink" },
  ],
  bucket: [
    { d: "M68.5 21.5C68 13 74 8.5 83 8.5C92 8.5 97 12.5 97 18L68.5 21.5Z", fill: "color", stroke: "ink" },
    {
      d: "M62 25L102 18.5C104 18.2 105.5 19.5 104.5 21C96 23.5 78 26.5 63.5 28C61.5 28.2 60.8 25.3 62 25Z",
      fill: "color",
      stroke: "ink",
    },
  ],
  headband: [{ d: "M66 21.8L98.3 16.8L98.1 13.4L66.4 18.4Z", fill: "color", stroke: "ink" }],
};

const LENS = circle(94, 24.5, 4.4);
export const EYEWEAR_LAYERS = {
  none: [],
  glasses: [
    { d: "M90 24.2L79 25.6", fill: "none", stroke: "color", width: 1.6 },
    { d: LENS, fill: "glass", stroke: "color", width: 1.6 },
  ],
  sunglasses: [
    { d: "M90 24.2L79 25.6", fill: "none", stroke: "color", width: 1.8 },
    { d: LENS, fill: "dark", stroke: "color", width: 1.8 },
  ],
} satisfies Record<string, ItemLayer[]>;

// Extras, each in the frame of the part that carries it.
export const EXTRA_PATHS = {
  // Forearm-local (wrist near y = 30).
  watchStrap: "M-5.3 22.6H5.3V26.4H-5.3Z",
  watchFace: "M3.6 21.6H7.4V27.4H3.6Z",
  bracelet: "M-5.4 27.4H5.4V30.2H-5.4Z",
  glovesCuff: "M-5.8 27.2H5.8V31.6H-5.8Z",
  // Body frame (leaned with the torso).
  scarfWrap: "M75 48.5C80 46.5 88 46.5 92 49L92.5 56C87 58.5 80 58.5 74.5 56Z",
  scarfTail: "M77 52L71.5 53.5L65.5 69C65 71 67 72 68.5 71L76 59Z",
  necklace: "M84 55C86 60.5 89.5 62.8 92.4 61.2",
  backpack: "M57 62C57 58 60 56 64 56L71 56L71 100L62 100C59 100 57 98 57 95Z",
  backpackStrap: "M70 58C74 54.5 82 54.3 85.5 58.5C88.5 64 89.2 72 86.5 80C83.5 88 77 94 71 97",
} as const;

export const EXTRA_ORDER: readonly Extra[] = ["backpack", "scarf", "necklace", "bracelet", "watch", "gloves"];

// Preset facial features, all in the head frame.
export const EYES = {
  dot: { cx: 92.5, cy: 24, r: 1.7 },
  wide: { cx: 92.8, cy: 24, r: 2.6, pupil: { cx: 93.6, cy: 24.2, r: 1.3 } },
  closed: "M90.3 24.2Q92.5 26 94.7 24.2",
} as const;

export const BROWS = {
  line: "M90 19.6L95.4 19.1",
  arched: "M89.8 20.2Q92.6 17.6 95.6 19.2",
} as const;

export const MOUTHS = {
  smile: "M92.6 34.6Q94.6 36.2 96.4 34",
  line: "M92.8 35L96.2 34.6",
  open: "M92.8 34L96.4 33.6Q96 37 94.2 36.6Q92.8 36 92.8 34Z",
} as const;

export const BLUSH = { cx: 90.5, cy: 30.5, r: 2.8, color: "#ee90a5" } as const;

export const SOLE_COLOR = "#ece8e0";
