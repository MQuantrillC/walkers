// A walker is stored as identifiers and colours, never as an image. The
// renderer rebuilds the figure from these values.

export const HAIR_STYLES = ["short", "bob", "bun", "long", "none"] as const;
export const TOP_STYLES = ["tee", "longsleeve"] as const;
export const BOTTOM_STYLES = ["trousers", "shorts", "skirt"] as const;

export type HairStyle = (typeof HAIR_STYLES)[number];
export type TopStyle = (typeof TOP_STYLES)[number];
export type BottomStyle = (typeof BOTTOM_STYLES)[number];

export type WalkerAppearance = {
  skin: string;
  hair: HairStyle;
  hairColor: string;
  top: TopStyle;
  topColor: string;
  bottom: BottomStyle;
  bottomColor: string;
  shoeColor: string;
};

export const PALETTE = {
  ink: "#211f1d",
  skin: ["#f5d6c1", "#e8bd9c", "#d09a71", "#ad7550", "#865437", "#5b3a26"],
  hair: ["#1f1b18", "#4b3427", "#8a5a33", "#c9964d", "#e6cb93", "#b5452f", "#a3a6aa"],
  cloth: [
    "#ece8e0", // chalk
    "#2e3441", // ink blue
    "#3c6cb4", // blue
    "#d8483e", // red
    "#f0b13a", // ochre
    "#3e8e6a", // green
    "#8d6bbd", // violet
    "#ee90a5", // pink
    "#7a5b44", // umber
    "#1e1d1c", // black
  ],
} as const;

export const DEFAULT_APPEARANCE: WalkerAppearance = {
  skin: PALETTE.skin[1],
  hair: "short",
  hairColor: PALETTE.hair[1],
  top: "tee",
  topColor: PALETTE.cloth[3],
  bottom: "trousers",
  bottomColor: PALETTE.cloth[1],
  shoeColor: PALETTE.cloth[0],
};
