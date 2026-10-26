import { DEFAULT_FACE, PALETTE, type WalkerAppearance } from "./appearance";

const skin = PALETTE.skin.map((s) => s.hex);
const hair = PALETTE.hair.map((s) => s.hex);
const cloth = Object.fromEntries(PALETTE.cloth.map((s) => [s.name, s.hex])) as Record<
  (typeof PALETTE.cloth)[number]["name"],
  string
>;

const base = {
  shoes: "sneaker",
  accessory: "none",
  accessoryColor: cloth.Black,
  face: DEFAULT_FACE,
} as const satisfies Partial<WalkerAppearance>;

// Hand-made sample walkers for testing outfits and colours.
export const SAMPLE_WALKERS: { name: string; appearance: WalkerAppearance }[] = [
  {
    name: "Ada",
    appearance: { ...base, skin: skin[1], hair: "short", hairColor: hair[1], top: "tee", topColor: cloth.Red, bottom: "trousers", bottomColor: cloth["Ink blue"], shoeColor: cloth.Chalk },
  },
  {
    name: "Noor",
    appearance: { ...base, skin: skin[3], hair: "long", hairColor: hair[0], top: "longsleeve", topColor: cloth.Ochre, bottom: "skirt", bottomColor: cloth["Ink blue"], shoes: "flat", shoeColor: cloth.Black, face: { ...DEFAULT_FACE, mouth: "smile" } },
  },
  {
    name: "Theo",
    appearance: { ...base, skin: skin[0], hair: "bob", hairColor: hair[4], top: "tee", topColor: cloth.Green, bottom: "shorts", bottomColor: cloth.Umber, shoeColor: cloth.Red },
  },
  {
    name: "Mia",
    appearance: { ...base, skin: skin[2], hair: "ponytail", hairColor: hair[2], top: "longsleeve", topColor: cloth.Pink, bottom: "trousers", bottomColor: cloth.Blue, shoeColor: cloth.Chalk, face: { ...DEFAULT_FACE, blush: true } },
  },
  {
    name: "Kofi",
    appearance: { ...base, skin: skin[5], hair: "afro", hairColor: hair[0], top: "tank", topColor: cloth.Chalk, bottom: "trousers", bottomColor: cloth.Black, shoeColor: cloth.Red },
  },
  {
    name: "Lena",
    appearance: { ...base, skin: skin[1], hair: "long", hairColor: hair[5], top: "tee", topColor: cloth["Ink blue"], bottom: "skirt", bottomColor: cloth.Violet, shoes: "boot", shoeColor: cloth.Black, accessory: "sunglasses" },
  },
  {
    name: "Sami",
    appearance: { ...base, skin: skin[4], hair: "short", hairColor: hair[0], top: "longsleeve", topColor: cloth.Blue, bottom: "trousers", bottomColor: cloth.Umber, shoeColor: cloth.Ochre, accessory: "cap", accessoryColor: cloth.Ochre },
  },
  {
    name: "Iris",
    appearance: { ...base, skin: skin[0], hair: "bun", hairColor: hair[6], top: "longsleeve", topColor: cloth.Violet, bottom: "trousers", bottomColor: cloth.Chalk, shoeColor: cloth["Ink blue"], accessory: "glasses", accessoryColor: cloth["Ink blue"] },
  },
];
