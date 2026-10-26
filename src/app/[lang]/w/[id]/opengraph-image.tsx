import { ImageResponse } from "next/og";
import { Walker } from "@/walker/Walker";
import { renderSvg } from "@/walker/svgString";
import { getPublishedWalker } from "@/walker/publicData";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

// The preview card shown when a walker's link is shared (WhatsApp,
// iMessage, Instagram DMs...): the walker mid-stride with its name.

export const alt = "A walker on WALKERS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f3f1ec";
const INK = "#211f1d";
const MUTED = "#6d675f";

export default async function Image({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const walker = await getPublishedWalker(id);
  const t = getDictionary(isLocale(lang) ? lang : "en");

  // CSS animations don't run in image rendering, so freeze a mid-stride frame.
  const svg = walker
    ? renderSvg(<Walker appearance={walker.appearance} height={560} frame={0.02} />).replace(
        "<svg ",
        '<svg xmlns="http://www.w3.org/2000/svg" ',
      )
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: PAPER,
          color: INK,
          padding: "0 80px",
          gap: 56,
        }}
      >
        {svg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            width={407}
            height={560}
            src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
          <div style={{ fontSize: 30, letterSpacing: 10, fontWeight: 600 }}>WALKERS</div>
          <div style={{ fontSize: 76, fontWeight: 600, lineHeight: 1.05 }}>{walker?.name ?? "WALKERS"}</div>
          <div style={{ fontSize: 32, color: MUTED }}>{`${t.home.headline} ${t.home.headlineEnd}`}</div>
        </div>
      </div>
    ),
    size,
  );
}
