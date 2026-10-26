import { ImageResponse } from "next/og";
import { Walker } from "@/walker/Walker";
import { renderSvg } from "@/walker/svgString";
import { DEFAULT_APPEARANCE, PALETTE, type WalkerAppearance } from "@/walker/appearance";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

// The preview card for the site itself (and pages without their own): the
// headline and three walkers mid-stride.

export const alt = "WALKERS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f2f0eb";
const INK = "#1f1e1c";
const ACCENT = "#d2492a";

const skin = PALETTE.skin.map((s) => s.hex);
const hair = PALETTE.hair.map((s) => s.hex);
const cloth = PALETTE.cloth.map((s) => s.hex);

const CROWD: WalkerAppearance[] = [
  { ...DEFAULT_APPEARANCE, skin: skin[6], hair: "afro", hairColor: hair[0], topColor: cloth[5], bottomColor: cloth[1] },
  { ...DEFAULT_APPEARANCE, skin: skin[0], hair: "bob", hairColor: hair[5], top: "hoodie", topColor: cloth[6], bottom: "skirt", bottomColor: cloth[11] },
  {
    ...DEFAULT_APPEARANCE,
    skin: skin[2],
    hair: "topknot",
    hairColor: hair[1],
    topColor: cloth[2],
    topPattern: "stripes",
    topPatternColor: cloth[0],
    extras: { headphones: cloth[4] },
  },
];

const image = (a: WalkerAppearance, frame: number) =>
  `data:image/svg+xml;base64,${Buffer.from(
    renderSvg(<Walker appearance={a} height={300} frame={frame} />).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '),
  ).toString("base64")}`;

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getDictionary(isLocale(lang) ? lang : "en");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: "64px 80px 0",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: ACCENT }}>Walkers</div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2 }}>{t.home.headline}</div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2, color: ACCENT }}>
            {t.home.headlineEnd.replace(" ", " ")}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 40, borderBottom: `3px solid ${INK}` }}>
          {CROWD.map((a, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} alt="" width={218} height={300} src={image(a, [0.02, 0.36, 0.7][i])} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
