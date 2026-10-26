// A walker is stored as identifiers and colours, never as an image. The
// renderer rebuilds the figure from these values.

export const HAIR_STYLES = [
  "short", "buzz", "quiff", "curly", "bob", "bun", "ponytail", "braid", "long", "afro", "mohawk", "none",
] as const;
export const FACIAL_HAIR = ["none", "stubble", "moustache", "beard"] as const;
export const TOP_STYLES = ["tee", "longsleeve", "tank", "hoodie"] as const;
export const BOTTOM_STYLES = ["trousers", "cropped", "shorts", "skirt"] as const;
export const SHOE_STYLES = ["sneaker", "hightop", "boot", "flat", "sandal"] as const;
export const HEADWEAR = ["none", "cap", "beanie", "bucket", "headband"] as const;
export const EYEWEAR = ["none", "glasses", "sunglasses"] as const;
// Extras can be combined; each one worn carries its own colour.
export const EXTRAS = ["bracelet", "watch", "gloves", "scarf", "necklace", "backpack"] as const;
export const EYE_STYLES = ["dot", "wide", "closed", "none"] as const;
export const BROW_STYLES = ["none", "line", "arched"] as const;
export const MOUTH_STYLES = ["none", "smile", "line", "open"] as const;
// Parts of the walker people can paint on.
export const SURFACES = ["face", "top", "bottom", "shoes"] as const;

export type HairStyle = (typeof HAIR_STYLES)[number];
export type FacialHair = (typeof FACIAL_HAIR)[number];
export type TopStyle = (typeof TOP_STYLES)[number];
export type BottomStyle = (typeof BOTTOM_STYLES)[number];
export type ShoeStyle = (typeof SHOE_STYLES)[number];
export type Headwear = (typeof HEADWEAR)[number];
export type Eyewear = (typeof EYEWEAR)[number];
export type Extra = (typeof EXTRAS)[number];
export type EyeStyle = (typeof EYE_STYLES)[number];
export type BrowStyle = (typeof BROW_STYLES)[number];
export type MouthStyle = (typeof MOUTH_STYLES)[number];
export type Surface = (typeof SURFACES)[number];

// One hand-painted stroke. Points are a flat [x0, y0, x1, y1, ...] list
// normalised to 0..1 across the surface's box (see surfaces.ts), so strokes
// scale with the walker and move with the body part they are painted on.
export type Stroke = {
  color: string;
  // Brush diameter in walker units.
  size: number;
  points: number[];
};

export type Paint = Record<Surface, Stroke[]>;

export type Face = {
  eyes: EyeStyle;
  brows: BrowStyle;
  mouth: MouthStyle;
  blush: boolean;
};

export type WalkerAppearance = {
  skin: string;
  hair: HairStyle;
  hairColor: string;
  facialHair: FacialHair;
  top: TopStyle;
  topColor: string;
  bottom: BottomStyle;
  bottomColor: string;
  shoes: ShoeStyle;
  shoeColor: string;
  headwear: Headwear;
  headwearColor: string;
  eyewear: Eyewear;
  eyewearColor: string;
  extras: Partial<Record<Extra, string>>;
  face: Face;
  paint: Paint;
};

// `id` is stable and used for translations; `hex` is what gets stored.
export type Swatch = { hex: string; id: string };

export const INK = "#211f1d";

export const PALETTE = {
  skin: [
    { hex: "#f5d6c1", id: "porcelain" },
    { hex: "#e8bd9c", id: "sand" },
    { hex: "#d09a71", id: "honey" },
    { hex: "#ad7550", id: "caramel" },
    { hex: "#865437", id: "chestnut" },
    { hex: "#5b3a26", id: "espresso" },
  ],
  hair: [
    { hex: "#1f1b18", id: "black" },
    { hex: "#4b3427", id: "darkBrown" },
    { hex: "#8a5a33", id: "brown" },
    { hex: "#c9964d", id: "darkBlonde" },
    { hex: "#e6cb93", id: "blonde" },
    { hex: "#b5452f", id: "auburn" },
    { hex: "#a3a6aa", id: "grey" },
    { hex: "#ee90a5", id: "pink" },
    { hex: "#3c6cb4", id: "blue" },
    { hex: "#3e8e6a", id: "green" },
  ],
  cloth: [
    { hex: "#ece8e0", id: "chalk" },
    { hex: "#2e3441", id: "inkBlue" },
    { hex: "#3c6cb4", id: "blue" },
    { hex: "#86b6d8", id: "sky" },
    { hex: "#d8483e", id: "red" },
    { hex: "#f0b13a", id: "ochre" },
    { hex: "#3e8e6a", id: "green" },
    { hex: "#8d6bbd", id: "violet" },
    { hex: "#ee90a5", id: "pink" },
    { hex: "#7a5b44", id: "umber" },
    { hex: "#9a9690", id: "stone" },
    { hex: "#1e1d1c", id: "black" },
  ],
  paint: [
    { hex: INK, id: "ink" },
    { hex: "#ffffff", id: "white" },
    { hex: "#d8483e", id: "red" },
    { hex: "#ee90a5", id: "pink" },
    { hex: "#f0b13a", id: "ochre" },
    { hex: "#f3e04f", id: "lemon" },
    { hex: "#3e8e6a", id: "green" },
    { hex: "#86b6d8", id: "sky" },
    { hex: "#3c6cb4", id: "blue" },
    { hex: "#8d6bbd", id: "violet" },
    { hex: "#7a5b44", id: "umber" },
    { hex: "#9a9690", id: "stone" },
  ],
} as const satisfies Record<string, readonly Swatch[]>;

// Brush diameters in walker units (the walker is 220 units tall).
export const BRUSH_SIZES = [
  { size: 1.1, id: "fine" },
  { size: 2, id: "medium" },
  { size: 3.4, id: "bold" },
] as const;

// Keep drawings small enough to store and cheap to render in a crowd.
export const PAINT_LIMITS = {
  strokesPerSurface: 60,
  pointsPerStroke: 300,
  pointsPerSurface: 2500,
} as const;

export const NAME_MAX = 24;

export const EMPTY_PAINT: Paint = { face: [], top: [], bottom: [], shoes: [] };

export const DEFAULT_FACE: Face = { eyes: "dot", brows: "none", mouth: "none", blush: false };

export const DEFAULT_APPEARANCE: WalkerAppearance = {
  skin: PALETTE.skin[1].hex,
  hair: "short",
  hairColor: PALETTE.hair[1].hex,
  facialHair: "none",
  top: "tee",
  topColor: PALETTE.cloth[4].hex,
  bottom: "trousers",
  bottomColor: PALETTE.cloth[1].hex,
  shoes: "sneaker",
  shoeColor: PALETTE.cloth[0].hex,
  headwear: "none",
  headwearColor: PALETTE.cloth[11].hex,
  eyewear: "none",
  eyewearColor: PALETTE.cloth[11].hex,
  extras: {},
  face: DEFAULT_FACE,
  paint: EMPTY_PAINT,
};
