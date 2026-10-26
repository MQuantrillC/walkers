import type { Accessory, HairStyle, ShoeStyle } from "./appearance";

// Path data for the original vector parts, in walker SVG units
// (viewBox 0 0 160 220, facing +x). Head parts are in the head's frame; the
// head circle is centred at (83, 27) with radius 15.5.

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

export { circle };

export const TORSO_TOP =
  "M70 61C70 56.5 74 54 80 54C87 54 93 57 93.5 64L93 82C92.5 91 91.5 97 91 104L69 104C68 94 67.5 82 68 72C68.3 66 69 63 70 61Z";
export const TORSO_SEAT =
  "M69 100L91 100C92.5 108 92.5 116 89.5 121C85.5 125.5 73 125.5 68.5 120.5C66 115 66.5 106 69 100Z";
export const NECK = "M77 36L87 36L87 58L77 58Z";
export const SKIRT = "M69 100L91 100C95 114 99 128 101 140C90 143 70 143 61 140C63 128 66 113 69 100Z";

// Limb-local overlays (limb hangs along +y from its joint).
export const SHORTS = "M-10 21L-10 0A10 10 0 0 1 10 0L10 21Z";
export const TEE_SLEEVE = "M-7 15L-7 0A7 7 0 0 1 7 0L7 15Z";

// Foot-local: ankle at the origin, sole along y = 8, toes towards +x.
export const SHOES: Record<ShoeStyle, string> = {
  sneaker: "M-6 2C-6-1-3-2 0-2L3-2C6-1 9 1 13 2C17 3 20 5 20 6.5C20 7.6 19.2 8 18 8L-6 8Z",
  boot: "M-7.5-12L7-12L7 0C10 1 13 2 16 3C19 4 20.5 5.5 20.5 6.8C20.5 7.7 19.7 8 18.5 8L-7.5 8Z",
  flat: "M-6 4C-6 2.5-4 2-1 2.5L4 3C9 3.2 14 3.6 17 4.5C19.3 5.2 20 6 20 6.8C20 7.7 19.2 8 18 8L-6 8Z",
};

const SHORT_HAIR =
  "M96 20C95 11 87 9 81 9.5C72 10 66 16 66.5 25C67 31 69 35 72 37L75 33C74 29 75 25 79 23C85 21 91 22 96 20Z";

// Drawn in order, each with its own outline.
export const HAIR: Record<HairStyle, string[]> = {
  short: [SHORT_HAIR],
  bob: [
    "M97 19C95 10 86 8 80 9C70 10 64.5 18 65 28C65.5 36 67 41 71 44L80 44C77 38 76 30 79 24C85 21 92 22 97 19Z",
  ],
  bun: [circle(70, 12, 6), SHORT_HAIR],
  ponytail: ["M69 17C61 18 57 27 58 40C58.5 45 62.5 46 64 42C63.5 34 65 27 71 22Z", SHORT_HAIR],
  long: [
    "M97 19C95 10 86 8 80 9C70 10 64 18 64 28L63 58C63 61 66 62 71 61L78 60C77 50 76 34 79 24C85 21 92 22 97 19Z",
  ],
  afro: [
    "M97 18C99 7 91 0 80 0.5C66 1 57.5 10 58 23C58.5 34 63 41 70 43L76 36C75 30 76 25 80 23C86 21 92 21 97 18Z",
  ],
  none: [],
};

// Accessory layers: `color` uses the accessory colour, `dark` a near-black
// lens, `glass` a faint tint.
export type AccessoryLayer = { d: string; fill: "color" | "dark" | "glass" | "none"; stroke?: "color" | "ink"; width?: number };

const LENS = circle(94, 24.5, 4.4);

export const ACCESSORY_LAYERS: Record<Accessory, AccessoryLayer[]> = {
  none: [],
  glasses: [
    { d: "M90 24.2L79 25.6", fill: "none", stroke: "color", width: 1.6 },
    { d: LENS, fill: "glass", stroke: "color", width: 1.6 },
  ],
  sunglasses: [
    { d: "M90 24.2L79 25.6", fill: "none", stroke: "color", width: 1.8 },
    { d: LENS, fill: "dark", stroke: "color", width: 1.8 },
  ],
  cap: [
    { d: "M66.5 23C66 14 72.5 8 82 8C91 8 97.5 13 98 20L98 21.5L66.5 23Z", fill: "color", stroke: "ink" },
    { d: "M96 18.5L109 19.6C110.2 19.7 110.2 21.7 109 21.8L96 21.8Z", fill: "color", stroke: "ink" },
  ],
  beanie: [
    { d: circle(81, 5.5, 3.6), fill: "color", stroke: "ink" },
    { d: "M66 22C65 12.5 72 6.5 82 6.5C92 6.5 98.5 12.5 98.5 20L66 22Z", fill: "color", stroke: "ink" },
    { d: "M65.5 24.5L99 22.2L99 17.5L65.8 19.5Z", fill: "color", stroke: "ink" },
  ],
};

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
