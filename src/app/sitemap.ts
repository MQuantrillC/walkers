import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { LOCALES } from "@/i18n/config";
import { listPublishedWalkers } from "@/walker/publicData";
import { SITE_URL } from "@/lib/seo";

// Every public page in both languages, including each published avatar's
// profile. Read at request time, so new avatars show up straight away.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const page = (path: string, lastModified?: string): MetadataRoute.Sitemap[number] => ({
    url: new URL(`/es${path}`, SITE_URL).href,
    lastModified,
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, new URL(`/${l}${path}`, SITE_URL).href])) },
  });
  const walkers = await listPublishedWalkers();
  return [
    page(""),
    page("/create"),
    page("/privacy"),
    ...walkers.map((w) => page(`/w/${w.id}`, w.updatedAt)),
  ];
}
