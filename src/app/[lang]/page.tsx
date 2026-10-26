import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/Gallery";
import { getGalleryPage, getPublishedWalker } from "@/walker/publicData";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { ArrowRight } from "@/components/icons";
import { pageMetadata } from "@/lib/seo";
import styles from "./home.module.css";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return pageMetadata(lang, "", { title: t.meta.title, description: t.meta.description });
}

// The Walk: the public gallery. The first page is rendered on the server;
// filtering, search and further pages load in the browser. `?w=<id>` puts
// that avatar at the front of the line (used right after publishing, so
// people see themselves walk in straight away).
export default async function Home({ params, searchParams }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <div className={styles.home}>
      <div className={`container ${styles.intro}`}>
        <h1>
          {t.home.headline} <span>{t.home.headlineEnd}</span>
        </h1>
        <Link href={`/${lang}/create`} className={styles.cta}>
          {t.home.cta}
          <ArrowRight />
        </Link>
      </div>
      <Suspense fallback={<div className={styles.walkway} aria-busy="true" />}>
        <FirstPage searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function FirstPage({ searchParams }: { searchParams: PageProps<"/[lang]">["searchParams"] }) {
  const { w } = await searchParams;
  const [page, featured] = await Promise.all([
    getGalleryPage({ order: "everyone", query: "", offset: 0 }),
    typeof w === "string" ? getPublishedWalker(w) : null,
  ]);
  return <Gallery initial={page} featured={featured} />;
}
