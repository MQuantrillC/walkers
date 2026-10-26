import type { Metadata } from "next";
import { LOCALES, type Locale } from "@/i18n/config";

// The address links are shared from: an explicit setting, else Vercel's
// production domain, else this machine. Makes every link in the page's
// metadata absolute, which link previews and search engines need.
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
);

const OG_LOCALE: Record<Locale, string> = { es: "es_419", en: "en_US" };

// Metadata shared by every public page: its own address, the same page in
// the other language, and the Open Graph basics previews read. `path` is
// what follows the locale ("" for the home page, "/w/<id>" for a profile).
export function pageMetadata(
  lang: Locale,
  path: string,
  { title, description, type = "website" }: { title: string; description: string; type?: "website" | "profile" },
): Metadata {
  const url = `/${lang}${path}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}${path}`])),
    },
    openGraph: { title, description, url, type, siteName: "WALKERS", locale: OG_LOCALE[lang] },
  };
}
