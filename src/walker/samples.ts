import { DEFAULT_APPEARANCE, DEFAULT_FACE, EMPTY_PAINT, PALETTE, type WalkerAppearance } from "./appearance";

const skin = PALETTE.skin.map((s) => s.hex);
const hair = Object.fromEntries(PALETTE.hair.map((s) => [s.id, s.hex])) as Record<(typeof PALETTE.hair)[number]["id"], string>;
const cloth = Object.fromEntries(PALETTE.cloth.map((s) => [s.id, s.hex])) as Record<
  (typeof PALETTE.cloth)[number]["id"],
  string
>;

const look = (o: Partial<WalkerAppearance>): WalkerAppearance => ({ ...DEFAULT_APPEARANCE, ...o });

// Horizontal stripes across the top (painted strokes, in top-box units).
const stripes = [0.3, 0.42, 0.54, 0.66].map((v) => ({ color: "#ffffff", size: 2, points: [0.1, v, 0.9, v] }));

// Hand-made sample walkers for testing outfits and colours.
export const SAMPLE_WALKERS: { name: string; appearance: WalkerAppearance }[] = [
  {
    name: "Ada",
    appearance: look({ skin: skin[2], hair: "short", hairColor: hair.darkBrown, topColor: cloth.red, bottomColor: cloth.inkBlue, shoeColor: cloth.chalk }),
  },
  {
    name: "Noor",
    appearance: look({
      skin: skin[6], hair: "long", hairColor: hair.black, top: "longsleeve", topColor: cloth.ochre, bottom: "skirt",
      bottomColor: cloth.inkBlue, shoes: "flat", shoeColor: cloth.black, face: { ...DEFAULT_FACE, mouth: "smile" },
      extras: { bracelet: cloth.chalk },
    }),
  },
  {
    name: "Theo",
    appearance: look({
      skin: skin[0], hair: "quiff", hairColor: hair.blonde, top: "tee", topColor: cloth.green, bottom: "shorts",
      bottomColor: cloth.umber, shoes: "hightop", shoeColor: cloth.red, extras: { backpack: cloth.ochre },
    }),
  },
  {
    name: "Mia",
    appearance: look({
      skin: skin[4], hair: "ponytail", hairColor: hair.brown, top: "longsleeve", topColor: cloth.pink, bottomColor: cloth.blue,
      face: { ...DEFAULT_FACE, blush: true }, paint: { ...EMPTY_PAINT, top: stripes },
    }),
  },
  {
    name: "Kofi",
    appearance: look({
      skin: skin[10], hair: "afro", hairColor: hair.black, facialHair: "beard", top: "tank", topColor: cloth.chalk,
      bottomColor: cloth.black, shoeColor: cloth.red, headwear: "beanie", headwearColor: cloth.ochre,
    }),
  },
  {
    name: "Lena",
    appearance: look({
      skin: skin[2], hair: "braid", hairColor: hair.auburn, top: "tee", topColor: cloth.inkBlue, bottom: "skirt",
      bottomColor: cloth.violet, shoes: "boot", shoeColor: cloth.black, eyewear: "sunglasses", extras: { scarf: cloth.ochre },
    }),
  },
  {
    name: "Sami",
    appearance: look({
      skin: skin[8], hair: "curly", hairColor: hair.black, facialHair: "moustache", top: "hoodie", topColor: cloth.blue,
      bottom: "cropped", bottomColor: cloth.umber, shoes: "sandal", shoeColor: cloth.ochre, headwear: "cap", headwearColor: cloth.ochre,
    }),
  },
  {
    name: "Iris",
    appearance: look({
      skin: skin[0], hair: "bun", hairColor: hair.grey, top: "longsleeve", topColor: cloth.violet, bottomColor: cloth.chalk,
      shoeColor: cloth.inkBlue, eyewear: "glasses", eyewearColor: cloth.inkBlue, extras: { necklace: cloth.ochre, watch: cloth.inkBlue },
    }),
  },
];
