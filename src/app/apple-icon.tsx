import { ImageResponse } from "next/og";

// The home-screen icon on iPhones: the favicon's walker, full bleed (iOS
// rounds the corners itself).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="180" height="180">
  <rect width="24" height="24" fill="#211f1d"/>
  <g transform="translate(2.4 2.2) scale(0.8)" fill="none" stroke="#f3f1ec" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="13.6" cy="4.6" r="2.5" fill="#ee7552" stroke="none"/>
    <path d="M12.9 8.6 11.6 14.2"/>
    <path d="M11.6 14.2 8.4 20.4M11.6 14.2l3.3 2.6.4 4"/>
    <path d="M12.6 9.6 9.4 12.7M12.6 9.6l2.6 3.3"/>
  </g>
</svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt="" width={180} height={180} src={`data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`} />
    ),
    size,
  );
}
