import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { HeadParts, Walker } from "@/walker/Walker";
import {
  DEFAULT_APPEARANCE,
  EYEWEAR,
  HAIR_STYLES,
  HEADWEAR,
  INK,
  PALETTE,
  TOP_PATTERNS,
  type HairStyle,
  type WalkerAppearance,
} from "@/walker/appearance";

export const metadata: Metadata = { title: "Heads · WALKERS", robots: { index: false } };

const cloth = Object.fromEntries(PALETTE.cloth.map((c) => [c.id, c.hex])) as Record<string, string>;
const skin = PALETTE.skin.map((s) => s.hex);
const base = { ...DEFAULT_APPEARANCE, headwearColor: cloth.red };

function Row({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }} data-row={name}>
      <code style={{ width: 70 }}>{name}</code>
      {children}
    </div>
  );
}

const head = (key: string, a: WalkerAppearance) => (
  <svg key={key} viewBox="50 -8 62 66" width={150} height={160} style={{ color: INK, background: "#f2f0eb" }}>
    <HeadParts a={a} />
  </svg>
);

const body = (key: string, a: WalkerAppearance) => (
  <div key={key} style={{ background: "#f2f0eb", padding: 8 }}>
    <Walker appearance={a} height={300} frame={0.3} />
  </div>
);

// Developer tool: every hat, hairstyle, pair of glasses and print drawn
// large. Not part of the public site.
export default function HeadsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div style={{ padding: 16, display: "grid", gap: 8 }}>
      {/* Every hairstyle under every hat. */}
      {HEADWEAR.map((h) => (
        <Row key={h} name={h}>
          {HAIR_STYLES.map((hair) => head(hair, { ...base, hair, hairColor: PALETTE.hair[2].hex, headwear: h }))}
        </Row>
      ))}
      <Row name="phones">
        {(["short", "long", "locs", "afro"] as HairStyle[]).map((hair) =>
          head(hair, { ...base, hair, extras: { headphones: cloth.black } }),
        )}
        {(["beanie", "tophat", "bucket"] as const).map((h) =>
          head(h, { ...base, headwear: h, extras: { headphones: cloth.sky } }),
        )}
      </Row>
      <Row name="freckles">
        {[0, 2, 5, 8, 11].map((i) =>
          head(`f${i}`, { ...base, skin: skin[i], face: { ...base.face, freckles: true, mouth: "smile" } }),
        )}
      </Row>
      <Row name="eyewear">
        {EYEWEAR.map((e) => head(e, { ...base, eyewear: e, eyewearColor: cloth.blue }))}
      </Row>
      <Row name="prints">
        {TOP_PATTERNS.map((p) => body(p, { ...base, topPattern: p, topColor: cloth.inkBlue, topPatternColor: cloth.chalk }))}
        {TOP_PATTERNS.map((p) =>
          body(`${p}-hoodie`, { ...base, top: "hoodie", topPattern: p, topColor: cloth.chalk, topPatternColor: cloth.red }),
        )}
      </Row>
    </div>
  );
}
