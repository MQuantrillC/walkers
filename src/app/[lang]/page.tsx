import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/Gallery";
import { getGalleryPage } from "@/walker/publicData";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { ArrowRight } from "@/components/icons";
import styles from "./home.module.css";

// The Walk: the public gallery. The first page is rendered on the server;
// filtering, search and further pages load in the browser.
export default async function Home({ params }: PageProps<"/[lang]">) {
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
        <FirstPage />
      </Suspense>
    </div>
  );
}

async function FirstPage() {
  const page = await getGalleryPage({ order: "everyone", query: "", offset: 0 });
  return <Gallery initial={page} />;
}
