import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { HeadParts, Walker } from "@/walker/Walker";
import { DEFAULT_APPEARANCE, INK, PALETTE, type WalkerAppearance } from "@/walker/appearance";
import { getDictionary } from "@/i18n/dictionaries";

export const metadata: Metadata = { title: "New · WALKERS", robots: { index: false } };

const cloth = Object.fromEntries(PALETTE.cloth.map((c) => [c.id, c.hex])) as Record<string, string>;
const hair = Object.fromEntries(PALETTE.hair.map((c) => [c.id, c.hex])) as Record<string, string>;
const skin = PALETTE.skin;
const tone = (id: string) => getDictionary("es").colors[id as keyof ReturnType<typeof getDictionary>["colors"]] ?? id;
const base: WalkerAppearance = { ...DEFAULT_APPEARANCE, headwearColor: cloth.red };
const face = (patch: Partial<WalkerAppearance["face"]>) => ({ ...base.face, ...patch });

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section data-shot={id} style={{ padding: "28px 32px 32px", background: "#f2f0eb", color: INK, width: "fit-content" }}>
      <h2 style={{ font: "700 26px/1.1 var(--font-display), sans-serif", margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
      {note && <p style={{ margin: "6px 0 0", font: "14px/1.4 var(--font-sans), sans-serif", color: "#6d675f" }}>{note}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 20, maxWidth: 1240 }}>{children}</div>
    </section>
  );
}

function Card({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure style={{ margin: 0, background: "#fbfaf7", border: "1px solid #dcd7cf", borderRadius: 14, padding: "10px 10px 8px" }}>
      {children}
      <figcaption style={{ textAlign: "center", font: "500 13px var(--font-sans), sans-serif", marginTop: 4 }}>{label}</figcaption>
    </figure>
  );
}

const Head = ({ a, size = 170 }: { a: WalkerAppearance; size?: number }) => (
  <svg viewBox="52 -9 64 64" width={size} height={size} style={{ color: INK, display: "block" }}>
    <HeadParts a={a} />
  </svg>
);

const Body = ({ a, height = 300, frame = 0.3 }: { a: WalkerAppearance; height?: number; frame?: number }) => (
  <div style={{ padding: "6px 4px 0", display: "flex", justifyContent: "center" }}>
    <Walker appearance={a} height={height} frame={frame} />
  </div>
);

// Developer tool: everything added recently, labelled, for review
// screenshots. Not part of the public site.
export default function NewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const newHair = [
    { id: "sidepart", label: "Raya al lado", color: hair.darkBrown },
    { id: "topknot", label: "Moño alto", color: hair.black },
    { id: "pigtails", label: "Coletas", color: hair.auburn },
    { id: "locs", label: "Rastas", color: hair.black },
  ] as const;
  const prints = [
    { id: "plain", label: "Liso" },
    { id: "stripes", label: "Rayas" },
    { id: "dots", label: "Lunares" },
    { id: "checks", label: "Cuadros" },
    { id: "band", label: "Franja" },
  ] as const;
  const hats = [
    { id: "tophat", label: "Chistera" },
    { id: "chullo", label: "Chullo" },
    { id: "beret", label: "Boina" },
    { id: "helmet", label: "Casco" },
  ] as const;
  return (
    <div style={{ display: "grid", gap: 24, padding: 24, background: "#1f1e1c" }}>
      <Section id="hair" title="Peinados nuevos" note="Cabeza de cerca y cuerpo entero, a mitad de paso.">
        {newHair.map((h) => (
          <Card key={h.id} label={h.label}>
            <Head a={{ ...base, hair: h.id, hairColor: h.color, skin: skin[3].hex }} />
          </Card>
        ))}
        {newHair.map((h, i) => (
          <Card key={`${h.id}-body`} label={h.label}>
            <Body
              a={{
                ...base,
                hair: h.id,
                hairColor: h.color,
                skin: skin[[3, 6, 1, 10][i]].hex,
                topColor: [cloth.green, cloth.ochre, cloth.sky, cloth.violet][i],
                bottom: i === 2 ? "skirt" : "trousers",
              }}
            />
          </Card>
        ))}
      </Section>

      <Section id="headphones" title="Audífonos" note="Cualquier color. Con sombrero, la diadema va por debajo.">
        <Card label="Negro · pelo corto">
          <Head a={{ ...base, extras: { headphones: cloth.black } }} />
        </Card>
        <Card label="Celeste · pelo largo">
          <Head a={{ ...base, hair: "long", hairColor: hair.blonde, extras: { headphones: cloth.sky } }} />
        </Card>
        <Card label="Rojo · rastas">
          <Head a={{ ...base, hair: "locs", hairColor: hair.black, skin: skin[9].hex, extras: { headphones: cloth.red } }} />
        </Card>
        <Card label="Con gorro">
          <Head a={{ ...base, headwear: "beanie", headwearColor: cloth.ochre, extras: { headphones: cloth.inkBlue } }} />
        </Card>
        <Card label="Con chistera">
          <Head a={{ ...base, headwear: "tophat", headwearColor: cloth.black, extras: { headphones: cloth.pink } }} />
        </Card>
        <Card label="Cuerpo entero">
          <Body a={{ ...base, hair: "topknot", extras: { headphones: cloth.green }, topColor: cloth.chalk, topPattern: "stripes", topPatternColor: cloth.green }} />
        </Card>
      </Section>

      <Section id="freckles" title="Pecas" note="Toman el tono de la piel: claras en piel clara, sutiles en piel oscura.">
        <Card label="Sin pecas">
          <Head a={{ ...base, skin: skin[0].hex, hair: "curly", hairColor: hair.auburn, face: face({ mouth: "smile" }) }} />
        </Card>
        {[0, 2, 4, 6, 8, 10].map((i) => (
          <Card key={i} label={tone(skin[i].id)}>
            <Head
              a={{
                ...base,
                skin: skin[i].hex,
                hair: i % 4 === 0 ? "curly" : "short",
                hairColor: i < 4 ? hair.auburn : hair.black,
                face: face({ freckles: true, mouth: "smile" }),
              }}
            />
          </Card>
        ))}
      </Section>

      <Section id="prints" title="Estampados" note="En el cuerpo y las mangas; se mueven con los brazos. Dos combinaciones de color.">
        {prints.map((p) => (
          <Card key={p.id} label={p.label}>
            <Body a={{ ...base, topPattern: p.id, topColor: cloth.inkBlue, topPatternColor: cloth.chalk }} />
          </Card>
        ))}
        {prints.map((p) => (
          <Card key={`${p.id}-2`} label={`${p.label} · manga larga`}>
            <Body
              a={{
                ...base,
                top: "longsleeve",
                topPattern: p.id,
                topColor: cloth.chalk,
                topPatternColor: cloth.red,
                skin: skin[7].hex,
                hair: "bob",
                hairColor: hair.black,
              }}
            />
          </Card>
        ))}
      </Section>

      <Section id="prints-mix" title="Estampados con otras prendas" note="Sudadera y tirantes (sin mangas, el estampado queda en el cuerpo).">
        <Card label="Sudadera · cuadros">
          <Body a={{ ...base, top: "hoodie", topPattern: "checks", topColor: cloth.green, topPatternColor: cloth.black }} />
        </Card>
        <Card label="Sudadera · franja">
          <Body a={{ ...base, top: "hoodie", topPattern: "band", topColor: cloth.black, topPatternColor: cloth.ochre }} />
        </Card>
        <Card label="Tirantes · rayas">
          <Body a={{ ...base, top: "tank", topPattern: "stripes", topColor: cloth.chalk, topPatternColor: cloth.blue }} />
        </Card>
        <Card label="Tirantes · lunares">
          <Body a={{ ...base, top: "tank", topPattern: "dots", topColor: cloth.pink, topPatternColor: cloth.chalk, bottom: "skirt" }} />
        </Card>
        <Card label="Camiseta · franja">
          <Body a={{ ...base, topPattern: "band", topColor: cloth.chalk, topPatternColor: cloth.red }} />
        </Card>
      </Section>

      <Section id="hats" title="Sombreros nuevos" note="La gorra está oculta por ahora (los avatares que ya la tienen la conservan).">
        {hats.map((h) => (
          <Card key={h.id} label={h.label}>
            <Head a={{ ...base, headwear: h.id, headwearColor: h.id === "tophat" ? cloth.black : cloth.red }} />
          </Card>
        ))}
        <Card label="Gorra (oculta)">
          <Head a={{ ...base, headwear: "cap", headwearColor: cloth.blue }} />
        </Card>
        {hats.map((h, i) => (
          <Card key={`${h.id}-body`} label={h.label}>
            <Body
              a={{
                ...base,
                headwear: h.id,
                headwearColor: [cloth.black, cloth.red, cloth.violet, cloth.ochre][i],
                hair: (["short", "long", "bob", "ponytail"] as const)[i],
                skin: skin[[2, 5, 8, 11][i]].hex,
              }}
            />
          </Card>
        ))}
      </Section>

      <Section id="glasses" title="Gafas deportivas" note="El lente toma el color elegido, con un brillo.">
        {[cloth.blue, cloth.red, cloth.ochre, cloth.black, cloth.violet].map((c) => (
          <Card key={c} label="Deportivas">
            <Head a={{ ...base, eyewear: "sport", eyewearColor: c }} />
          </Card>
        ))}
        <Card label="Con casco">
          <Head a={{ ...base, eyewear: "sport", eyewearColor: cloth.sky, headwear: "helmet", headwearColor: cloth.green }} />
        </Card>
      </Section>

      <Section id="skin" title="Tonos de piel" note="12 tonos en un deslizador; los 6 originales se mantienen exactos.">
        {skin.map((s) => (
          <Card key={s.id} label={tone(s.id)}>
            <Head a={{ ...base, skin: s.hex, hair: "none" }} size={92} />
          </Card>
        ))}
      </Section>

      <Section id="combos" title="Todo junto" note="Algunas combinaciones caminando, como se verían en El Camino.">
        {[
          { ...base, hair: "locs" as const, hairColor: hair.black, skin: skin[9].hex, extras: { headphones: cloth.ochre }, topPattern: "band" as const, topColor: cloth.inkBlue, topPatternColor: cloth.ochre },
          { ...base, hair: "pigtails" as const, hairColor: hair.auburn, skin: skin[0].hex, face: face({ freckles: true, mouth: "smile", blush: true }), topPattern: "dots" as const, topColor: cloth.sky, topPatternColor: cloth.chalk, bottom: "skirt" as const, bottomColor: cloth.black },
          { ...base, hair: "topknot" as const, hairColor: hair.black, skin: skin[5].hex, eyewear: "sport" as const, eyewearColor: cloth.red, headwear: "helmet" as const, headwearColor: cloth.chalk, top: "tank" as const, topColor: cloth.black, bottom: "shorts" as const },
          { ...base, hair: "sidepart" as const, hairColor: hair.blonde, skin: skin[2].hex, top: "longsleeve" as const, topPattern: "stripes" as const, topColor: cloth.chalk, topPatternColor: cloth.inkBlue, headwear: "beret" as const, headwearColor: cloth.red },
          { ...base, hair: "short" as const, skin: skin[7].hex, top: "hoodie" as const, topPattern: "checks" as const, topColor: cloth.red, topPatternColor: cloth.black, headwear: "chullo" as const, headwearColor: cloth.ochre, extras: { headphones: cloth.black } },
          { ...base, hair: "afro" as const, hairColor: hair.black, skin: skin[11].hex, headwear: "tophat" as const, headwearColor: cloth.black, topColor: cloth.violet, face: face({ freckles: true }) },
        ].map((a, i) => (
          <Card key={i} label={`Avatar ${i + 1}`}>
            <Body a={a} frame={(i * 0.17) % 1} />
          </Card>
        ))}
      </Section>
    </div>
  );
}
