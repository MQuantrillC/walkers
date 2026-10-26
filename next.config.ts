import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// What pages may load and who may frame them. No nonces: they don't mix
// with partial prerendering, so inline scripts are allowed instead (React
// escapes all user text, and walkers are sanitised before they render).
// Images: our own, generated ones, and Google profile photos.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://lh3.googleusercontent.com",
  "font-src 'self'",
  `connect-src 'self' ${supabase}${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Older browsers' version of frame-ancestors: no one can frame the site
  // (and trick people into clicking "delete").
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // A stray lockfile in the home directory otherwise makes Next.js guess the
  // wrong workspace root.
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
