import { PALETTE, type WalkerAppearance } from "./appearance";

const { skin, hair, cloth } = PALETTE;

// Hand-made sample walkers for testing outfits and colours before the
// creator exists.
export const SAMPLE_WALKERS: { name: string; appearance: WalkerAppearance }[] = [
  {
    name: "Ada",
    appearance: { skin: skin[1], hair: "short", hairColor: hair[1], top: "tee", topColor: cloth[3], bottom: "trousers", bottomColor: cloth[1], shoeColor: cloth[0] },
  },
  {
    name: "Noor",
    appearance: { skin: skin[3], hair: "long", hairColor: hair[0], top: "longsleeve", topColor: cloth[4], bottom: "skirt", bottomColor: cloth[1], shoeColor: cloth[9] },
  },
  {
    name: "Theo",
    appearance: { skin: skin[0], hair: "bob", hairColor: hair[4], top: "tee", topColor: cloth[5], bottom: "shorts", bottomColor: cloth[8], shoeColor: cloth[3] },
  },
  {
    name: "Mia",
    appearance: { skin: skin[2], hair: "bun", hairColor: hair[2], top: "longsleeve", topColor: cloth[7], bottom: "trousers", bottomColor: cloth[2], shoeColor: cloth[0] },
  },
  {
    name: "Kofi",
    appearance: { skin: skin[5], hair: "none", hairColor: hair[0], top: "tee", topColor: cloth[0], bottom: "trousers", bottomColor: cloth[9], shoeColor: cloth[3] },
  },
  {
    name: "Lena",
    appearance: { skin: skin[1], hair: "long", hairColor: hair[5], top: "tee", topColor: cloth[1], bottom: "skirt", bottomColor: cloth[6], shoeColor: cloth[9] },
  },
  {
    name: "Sami",
    appearance: { skin: skin[4], hair: "short", hairColor: hair[0], top: "longsleeve", topColor: cloth[2], bottom: "trousers", bottomColor: cloth[8], shoeColor: cloth[4] },
  },
  {
    name: "Iris",
    appearance: { skin: skin[0], hair: "bob", hairColor: hair[6], top: "longsleeve", topColor: cloth[6], bottom: "trousers", bottomColor: cloth[0], shoeColor: cloth[1] },
  },
];
