export const en = {
  meta: {
    title: "WALKERS",
    description: "Create a walker. Add it to the procession.",
    create: "Create · WALKERS",
  },
  nav: {
    walk: "The Walk",
    create: "Create",
    language: "Language",
    switchTo: "Español",
  },
  home: {
    headline: "Create a person. Make them your own. Watch them walk.",
    cta: "Create your walker",
  },
  creator: {
    steps: { you: "You", clothes: "Clothes", extras: "Extras", paint: "Paint", preview: "Preview" },
    stepsLabel: "Creator steps",
    previewLabel: "Live preview",
    walking: (name: string) => `${name}, walking`,
    defaultName: "Your walker",
    randomise: "Randomise look",
    startOver: "Start over",
    confirmStartOver: "Tap again to start over",
    draftSaved: "Your draft is saved on this device.",
    draftUnavailable: "This browser won't let us save a draft, so keep this tab open.",
    back: "Back",
    next: "Next",
    name: "Display name",
    namePlaceholder: "Give your walker a name",
    nameHelp: (left: number) =>
      `Shown with your walker in the public gallery. ${left} ${left === 1 ? "character" : "characters"} left.`,
    skin: "Skin",
    hair: "Hair",
    hairColor: "Hair colour",
    facialHair: "Facial hair",
    top: "Top",
    topColor: "Top colour",
    bottom: "Bottoms",
    bottomColor: "Bottoms colour",
    shoes: "Shoes",
    shoeColor: "Shoe colour",
    headwear: "Headwear",
    headwearColor: "Headwear colour",
    eyewear: "Eyewear",
    eyewearColor: "Eyewear colour",
    extras: "Extras",
    extrasHelp: "Tap to add or remove. Wear as many as you like.",
    extraColor: (item: string) => `${item} colour`,
    eyes: "Eyes",
    brows: "Brows",
    mouth: "Mouth",
    blush: "Blush",
    off: "Off",
    on: "On",
    paintWhat: "What to paint",
    readyTitle: (name: string) => `${name} is ready to walk.`,
    readyBody:
      "This is how your walker looks in the procession. Signing in and publishing to the public gallery come next.",
    processionLabel: "Your walker in the procession",
  },
  paint: {
    canvasLabel: (part: string) => `Painting area for the ${part}. Draw with a mouse, pen or finger.`,
    tool: "Painting tool",
    brush: "Brush",
    eraser: "Eraser",
    undo: "Undo",
    redo: "Redo",
    clear: "Clear",
    confirmClear: "Tap again to clear",
    size: "Brush size",
    colour: "Paint colour",
    hint: (part: string, used: number, max: number) => `Paint on the ${part}. ${used} of ${max} strokes used.`,
    full: "This part has reached its painting limit. Erase or undo a stroke to paint more.",
    tooBig: "That stroke would go over the painting limit.",
    surfaces: { face: "Face", top: "Top", bottom: "Bottoms", shoes: "Shoes" },
    surfaceNouns: { face: "face", top: "top", bottom: "bottoms", shoes: "shoes" },
    sizes: { fine: "Fine", medium: "Medium", bold: "Bold" },
  },
  options: {
    hair: {
      short: "Short", buzz: "Buzz cut", quiff: "Quiff", curly: "Curly", bob: "Bob", bun: "Bun",
      ponytail: "Ponytail", braid: "Braid", long: "Long", afro: "Afro", mohawk: "Mohawk", none: "None",
    },
    facialHair: { none: "None", stubble: "Stubble", moustache: "Moustache", beard: "Beard" },
    top: { tee: "T-shirt", longsleeve: "Long sleeve", tank: "Tank top", hoodie: "Hoodie" },
    bottom: { trousers: "Trousers", cropped: "Cropped", shorts: "Shorts", skirt: "Skirt" },
    shoes: { sneaker: "Trainers", hightop: "High-tops", boot: "Boots", flat: "Flats", sandal: "Sandals" },
    headwear: { none: "None", cap: "Cap", beanie: "Beanie", bucket: "Bucket hat", headband: "Headband" },
    eyewear: { none: "None", glasses: "Glasses", sunglasses: "Sunglasses" },
    extras: {
      bracelet: "Bracelet", watch: "Watch", gloves: "Gloves", scarf: "Scarf", necklace: "Necklace", backpack: "Backpack",
    },
    eyes: { dot: "Dot", wide: "Wide", closed: "Closed", none: "None" },
    brows: { none: "None", line: "Straight", arched: "Arched" },
    mouth: { none: "None", smile: "Smile", line: "Straight", open: "Open" },
  },
  colors: {
    porcelain: "Porcelain", sand: "Sand", honey: "Honey", caramel: "Caramel", chestnut: "Chestnut", espresso: "Espresso",
    black: "Black", darkBrown: "Dark brown", brown: "Brown", darkBlonde: "Dark blonde", blonde: "Blonde",
    auburn: "Auburn", grey: "Grey", pink: "Pink", blue: "Blue", green: "Green",
    chalk: "Chalk", inkBlue: "Ink blue", sky: "Sky", red: "Red", ochre: "Ochre", violet: "Violet",
    umber: "Umber", stone: "Stone", ink: "Ink", white: "White", lemon: "Lemon",
  },
};

// Every language must provide the same keys, with the same kinds of values.
type Shape<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : T[K] extends string
      ? string
      : Shape<T[K]>;
};
export type Dictionary = Shape<typeof en>;
