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

// Hats hide whatever hair sits above their lower edge; hair below it (an
// afro's sides, a braid, long hair) still shows. Each clip keeps everything
// under the hat's edge, extended sideways, and its edge runs exactly along
// the hat's own outline so the hat's stroke covers the cut.
const UNDER_BRIM = "M0 32.3L160 9.8L160 220L0 220Z";
// The beanie cuff's lower edge, from behind the ear up to the forehead.
const BEANIE_EDGE = "M65.2 29.9C75.2 28.3 89.3 22.9 98.1 18.4";
// Past the forehead the edge turns down, so nothing pokes out in front.
const UNDER_BEANIE = `M0 34L${BEANIE_EDGE.slice(1)}L104 25L160 25L160 220L0 220Z`;
export const HAIR_CLIP: Partial<Record<Headwear, string>> = {
  cap: "M0 37.3L160 8.7L160 220L0 220Z",
  tophat: "M0 27.6L160 4.6L160 220L0 220Z",
  bucket: UNDER_BRIM,
  beanie: UNDER_BEANIE,
  chullo: UNDER_BEANIE,
  beret: "M0 29.1L160 13.2L160 220L0 220Z",
  helmet: "M0 35.5L160 12L160 220L0 220Z",
};

// Voluminous styles squashed under a hat: a rounded puff hugging the back
// of the head below the hat's edge, instead of whatever wedge of the full
// shape would be left after hiding the top.
export const HAIR_UNDER_HAT: Partial<Record<HairStyle, HairLayer[]>> = {
  afro: [
    { d: "M66.5 22C62.5 24.5 61 30 62.3 34.6C63.4 38.6 66.8 41.6 71.2 41.8L76.2 36.5C74.6 32.3 74.8 28.2 77.4 24.6Z" },
  ],
  curly: [
    {
      d: "M66.5 22C63 24 62 28.5 63.6 31.5C62.4 34.5 64 38 67.4 38.6C68.6 41 72 41.6 74.2 40L76.8 35.5C75.2 31.5 75.4 27.5 77.8 24.6Z",
    },
  ],
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
// near-black lens, `glass` a faint tint; a `light` stroke is a pale
// highlight or knitted pattern.
export type ItemLayer = {
  d: string;
  fill: "color" | "dark" | "glass" | "none";
  stroke?: "color" | "ink" | "light";
  width?: number;
};

export const HEADWEAR_LAYERS: Record<Headwear, ItemLayer[]> = {
  none: [],
  // A structured crown that sits snug on the head, a button on top, one
  // seam, and a bill that curves down and thins towards its tip.
  cap: [
    { d: circle(81.6, 7.6, 1.7), fill: "color", stroke: "ink", width: 1.6 },
    {
      d: "M96.5 17.6C102 17.4 107.5 18.6 111.5 21.2C112.6 21.9 112.2 23.3 110.8 23.1C106 22.4 101.5 22 97.5 22.4Z",
      fill: "color",
      stroke: "ink",
    },
    { d: "M65.8 25.5C64.8 15 71.5 8 81.5 8C91 8 97.8 13 98.8 19.6Z", fill: "color", stroke: "ink" },
    { d: "M82.4 8.6C88.4 9.8 93.6 13.6 95.8 19.2", fill: "none", stroke: "ink", width: 0.9 },
  ],
  // One knitted piece that hugs the skull: the crown follows the head's
  // curve a little outside it, and the folded cuff wraps from the forehead
  // down to behind the ear.
  beanie: [
    { d: circle(80.5, 3.8, 3.4), fill: "color", stroke: "ink" },
    {
      // Crown, then back down along BEANIE_EDGE to close.
      d: "M97.4 18C97.8 9.6 91 4.4 82.4 4.4C72.2 4.4 65.2 11.6 65.2 20.8C65.2 24.2 65.5 27.2 65.9 29.5C75 27.8 89 22.5 97.4 18Z",
      fill: "color",
      stroke: "ink",
    },
    // Folded cuff, standing slightly proud of the crown at both ends.
    { d: "M64.7 24.4C74.5 22.8 88.8 17.6 98.3 13.1L98.1 18.4C89.3 22.9 75.2 28.3 65.2 29.9Z", fill: "color", stroke: "ink" },
  ],
  // Tall crown with a band, on a brim that curls up at both ends. Kept
  // under the top of the frame so it isn't cut off in the walk.
  tophat: [
    { d: "M70 17.8L69.6 2C69.6 1.2 70.2 0.6 71 0.5L94.8-2.9C95.7-3 96.4-2.4 96.4-1.5L96 13.9Z", fill: "color", stroke: "ink" },
    { d: "M70 17.6L69.8 13.4L96.2 9.6L96 13.9Z", fill: "glass", stroke: "ink", width: 1.4 },
    {
      d: "M63.5 20.6C63 19.2 64.5 18.3 67 18L99 13.4C101.5 13 103 13.6 102.8 15C102.6 16.3 101 17 99.5 17.2L67.5 21.8C65.5 22.1 63.8 21.7 63.5 20.6Z",
      fill: "color",
      stroke: "ink",
    },
  ],
  // The beanie's Andean cousin: earflap, tie and a knitted zigzag.
  chullo: [
    { d: circle(80.5, 3.8, 3.4), fill: "color", stroke: "ink" },
    { d: "M77 39.5C76.5 43 76.8 46.5 77.5 49", fill: "none", stroke: "ink", width: 1.4 },
    { d: circle(77.6, 50.2, 1.5), fill: "color", stroke: "ink", width: 1.4 },
    { d: "M71.4 27.4C72 32.5 74 37 77 39.5C79.5 37 81 31.5 80.8 25.4Z", fill: "color", stroke: "ink" },
    {
      d: "M97.4 18C97.8 9.6 91 4.4 82.4 4.4C72.2 4.4 65.2 11.6 65.2 20.8C65.2 24.2 65.5 27.2 65.9 29.5C75 27.8 89 22.5 97.4 18Z",
      fill: "color",
      stroke: "ink",
    },
    { d: "M67.6 24.2L70.3 20.6L73.0 22.2L75.7 18.6L78.4 20.2L81.1 16.7L83.8 18.3L86.5 14.7L89.2 16.3L91.9 12.7", fill: "none", stroke: "light", width: 1.3 },
  ],
  bucket: [
    { d: "M68.5 21.5C68 13 74 8.5 83 8.5C92 8.5 97 12.5 97 18L68.5 21.5Z", fill: "color", stroke: "ink" },
    {
      d: "M62 25L102 18.5C104 18.2 105.5 19.5 104.5 21C96 23.5 78 26.5 63.5 28C61.5 28.2 60.8 25.3 62 25Z",
      fill: "color",
      stroke: "ink",
    },
  ],
  // Soft and slouched towards the back, with a little stalk on top.
  beret: [
    { d: "M82.6 7.4L83.4 4.2", fill: "none", stroke: "ink", width: 2 },
    {
      d: "M66 22.5C62 18 64 10.5 74 8.2C83 6.2 95 8 98.8 13.5C100.5 16 99.5 18.6 97.2 19.4C88 21.6 75 22.8 66 22.5Z",
      fill: "color",
      stroke: "ink",
    },
  ],
  // A long shell with a pointed tail, air vents and a short visor.
  helmet: [
    {
      d: "M97.6 18.8L105.4 19.8C106.8 20 106.8 22.2 105.4 22.3L98 22.6Z",
      fill: "color",
      stroke: "ink",
      width: 1.6,
    },
    {
      d: "M61 22C61.5 12 70.5 5.5 82.5 5.5C93 5.5 100 11.5 100.8 18.8C101 20.3 100 21 98.6 21L68 25.5C65 26 62.5 24.5 61 22Z",
      fill: "color",
      stroke: "ink",
    },
    { d: "M72 10.9C74 9.4 76.5 8.6 79 8.4L79.4 10.6C77 10.8 74.8 11.6 73.1 12.8Z", fill: "dark", stroke: "ink", width: 1 },
    { d: "M82.4 8.2C85.4 8.2 88.4 9 90.9 10.5L89.8 12.4C87.6 11.2 85 10.5 82.4 10.5Z", fill: "dark", stroke: "ink", width: 1 },
    { d: "M93.2 12C95.2 13.4 96.8 15.4 97.8 17.6L95.7 18.2C94.9 16.4 93.7 14.8 92.1 13.6Z", fill: "dark", stroke: "ink", width: 1 },
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
  // Wraparound cycling shades: one mirrored lens in the chosen colour that
  // curves past the face, with a glint.
  sport: [
    { d: "M86 23.4L76.5 25", fill: "none", stroke: "ink", width: 1.8 },
    {
      d: "M85.5 21.6C90.5 20.4 96.5 20.2 100.3 21.3C100.8 23.6 100 26.2 98.7 27.6C95 28.5 90.5 28.1 87.6 27C86 26.3 85.2 24 85.5 21.6Z",
      fill: "color",
      stroke: "ink",
      width: 1.6,
    },
    { d: "M88.4 23C91.5 22.3 95 22.2 97.6 22.7", fill: "none", stroke: "light", width: 1 },
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
