import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeadParts } from "@/walker/Walker";
import { DEFAULT_APPEARANCE, EYEWEAR, HEADWEAR, INK, PALETTE, type HairStyle } from "@/walker/appearance";

export const metadata: Metadata = { title: "Heads · WALKERS", robots: { index: false } };

const HAIR: HairStyle[] = ["short", "long", "afro", "ponytail", "none"];
const red = PALETTE.cloth[4].hex;

// Developer tool: every hat on every hairstyle, and every pair of glasses,
// drawn large. Not part of the public site.
export default function HeadsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const head = (key: string, a: typeof DEFAULT_APPEARANCE) => (
    <svg key={key} viewBox="54 -8 62 62" width={250} height={250} style={{ color: INK, background: "#f2f0eb" }}>
      <HeadParts a={a} />
    </svg>
  );
  return (
    <div style={{ padding: 16, display: "grid", gap: 8 }}>
      {HEADWEAR.map((h) => (
        <div key={h} style={{ display: "flex", gap: 8, alignItems: "center" }} data-row={h}>
          <code style={{ width: 70 }}>{h}</code>
          {HAIR.map((hair) => head(hair, { ...DEFAULT_APPEARANCE, hair, headwear: h, headwearColor: red }))}
        </div>
      ))}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }} data-row="eyewear">
        <code style={{ width: 70 }}>eyewear</code>
        {EYEWEAR.map((e) =>
          [PALETTE.cloth[4], PALETTE.cloth[2], PALETTE.cloth[11]].map((c) =>
            head(`${e}${c.hex}`, { ...DEFAULT_APPEARANCE, eyewear: e, eyewearColor: c.hex, face: { ...DEFAULT_APPEARANCE.face, brows: "line" } }),
          ),
        )}
      </div>
    </div>
  );
}
