// A walker is stored as identifiers and colours, never as an image. The
// renderer rebuilds the figure from these values.

export const HAIR_STYLES = ["short", "bob", "bun", "ponytail", "long", "afro", "none"] as const;
export const TOP_STYLES = ["tee", "longsleeve", "tank"] as const;
export const BOTTOM_STYLES = ["trousers", "shorts", "skirt"] as const;
export const SHOE_STYLES = ["sneaker", "boot", "flat"] as const;
export const ACCESSORIES = ["none", "glasses", "sunglasses", "cap", "beanie"] as const;
export const EYE_STYLES = ["dot", "wide", "closed", "none"] as const;
export const BROW_STYLES = ["none", "line", "arched"] as const;
export const MOUTH_STYLES = ["none", "smile", "line", "open"] as const;

export type HairStyle = (typeof HAIR_STYLES)[number];
export type TopStyle = (typeof TOP_STYLES)[number];
export type BottomStyle = (typeof BOTTOM_STYLES)[number];
export type ShoeStyle = (typeof SHOE_STYLES)[number];
export type Accessory = (typeof ACCESSORIES)[number];
export type EyeStyle = (typeof EYE_STYLES)[number];
export type BrowStyle = (typeof BROW_STYLES)[number];
export type MouthStyle = (typeof MOUTH_STYLES)[number];

// One hand-drawn stroke on the face. Points are a flat [x0, y0, x1, y1, ...]
// list in head-box coordinates (0..1 across the head's bounding square), so
// strokes scale with the walker and move with the head while it walks.
export type FaceStroke = {
  color: string;
  // Brush diameter as a fraction of the head-box width.
  size: number;
  points: number[];
};

export type Face = {
  eyes: EyeStyle;
  brows: BrowStyle;
  mouth: MouthStyle;
  blush: boolean;
  strokes: FaceStroke[];
};

export type WalkerAppearance = {
  skin: string;
  hair: HairStyle;
  hairColor: string;
  top: TopStyle;
  topColor: string;
  bottom: BottomStyle;
  bottomColor: string;
  shoes: ShoeStyle;
  shoeColor: string;
  accessory: Accessory;
  accessoryColor: string;
  face: Face;
};

export type Swatch = { hex: string; name: string };

export const INK = "#211f1d";

export const PALETTE = {
  skin: [
    { hex: "#f5d6c1", name: "Porcelain" },
    { hex: "#e8bd9c", name: "Sand" },
    { hex: "#d09a71", name: "Honey" },
    { hex: "#ad7550", name: "Caramel" },
    { hex: "#865437", name: "Chestnut" },
    { hex: "#5b3a26", name: "Espresso" },
  ],
  hair: [
    { hex: "#1f1b18", name: "Black" },
    { hex: "#4b3427", name: "Dark brown" },
    { hex: "#8a5a33", name: "Brown" },
    { hex: "#c9964d", name: "Dark blonde" },
    { hex: "#e6cb93", name: "Blonde" },
    { hex: "#b5452f", name: "Auburn" },
    { hex: "#a3a6aa", name: "Grey" },
    { hex: "#ee90a5", name: "Pink" },
    { hex: "#3c6cb4", name: "Blue" },
  ],
  cloth: [
    { hex: "#ece8e0", name: "Chalk" },
    { hex: "#2e3441", name: "Ink blue" },
    { hex: "#3c6cb4", name: "Blue" },
    { hex: "#86b6d8", name: "Sky" },
    { hex: "#d8483e", name: "Red" },
    { hex: "#f0b13a", name: "Ochre" },
    { hex: "#3e8e6a", name: "Green" },
    { hex: "#8d6bbd", name: "Violet" },
    { hex: "#ee90a5", name: "Pink" },
    { hex: "#7a5b44", name: "Umber" },
    { hex: "#9a9690", name: "Stone" },
    { hex: "#1e1d1c", name: "Black" },
  ],
  face: [
    { hex: INK, name: "Ink" },
    { hex: "#ffffff", name: "White" },
    { hex: "#d8483e", name: "Red" },
    { hex: "#ee90a5", name: "Pink" },
    { hex: "#3c6cb4", name: "Blue" },
    { hex: "#3e8e6a", name: "Green" },
    { hex: "#f0b13a", name: "Ochre" },
    { hex: "#7a5b44", name: "Umber" },
  ],
} as const satisfies Record<string, readonly Swatch[]>;

export const BRUSH_SIZES = [
  { size: 0.035, name: "Fine" },
  { size: 0.06, name: "Medium" },
  { size: 0.1, name: "Bold" },
] as const;

// Keep drawings small enough to store and cheap to render in a crowd.
export const FACE_LIMITS = {
  strokes: 80,
  pointsPerStroke: 300,
  totalPoints: 4000,
} as const;

export const NAME_MAX = 24;

export const DEFAULT_FACE: Face = {
  eyes: "dot",
  brows: "none",
  mouth: "none",
  blush: false,
  strokes: [],
};

export const DEFAULT_APPEARANCE: WalkerAppearance = {
  skin: PALETTE.skin[1].hex,
  hair: "short",
  hairColor: PALETTE.hair[1].hex,
  top: "tee",
  topColor: PALETTE.cloth[4].hex,
  bottom: "trousers",
  bottomColor: PALETTE.cloth[1].hex,
  shoes: "sneaker",
  shoeColor: PALETTE.cloth[0].hex,
  accessory: "none",
  accessoryColor: PALETTE.cloth[11].hex,
  face: DEFAULT_FACE,
};
