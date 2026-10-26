import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { HeadParts, Walker } from "@/walker/Walker";
import {
  DEFAULT_APPEARANCE,
  EYEWEAR,
  HEADWEAR,
  INK,
  PALETTE,
  TOP_PATTERNS,
  type HairStyle,
  type WalkerAppearance,
} from "@/walker/appearance";

export const metadata: Metadata = { title: "Heads · WALKERS", robots: { index: false } };

const HAIR: HairStyle[] = ["short", "long", "afro", "ponytail", "none"];
const NEW_HAIR: HairStyle[] = ["sidepart", "topknot", "pigtails", "locs"];
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
  <svg key={key} viewBox="54 -8 62 62" width={220} height={220} style={{ color: INK, background: "#f2f0eb" }}>
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
      {HEADWEAR.map((h) => (
        <Row key={h} name={h}>
          {HAIR.map((hair) => head(hair, { ...base, hair, headwear: h }))}
        </Row>
      ))}
      <Row name="new hair">
        {NEW_HAIR.map((hair) => head(hair, { ...base, hair, hairColor: PALETTE.hair[2].hex }))}
        {NEW_HAIR.map((hair) => head(`${hair}-beanie`, { ...base, hair, headwear: "beanie" }))}
      </Row>
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
