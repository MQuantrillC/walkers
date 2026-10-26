import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Procession } from "@/components/Procession";
import { getLatestWalkers } from "@/walker/publicData";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import styles from "./home.module.css";

// The Walk: the newest published walkers, each linking to its profile. The
// full gallery (paging, search, Latest) comes in Stage 4.
export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <div className={styles.home}>
      <div className={styles.intro}>
        <h1>{t.home.headline}</h1>
        <Link href={`/${lang}/create`} className={styles.cta}>
          {t.home.cta}
        </Link>
      </div>
      <Suspense fallback={<div className={`${styles.walkway} paper`} aria-busy="true" />}>
        <LatestProcession lang={lang} t={t} />
      </Suspense>
    </div>
  );
}

async function LatestProcession({ lang, t }: { lang: Locale; t: Dictionary }) {
  const latest = await getLatestWalkers(16);
  if (!latest.length) {
    return (
      <div className={`${styles.walkway} ${styles.empty} paper`}>
        <p>{t.home.empty}</p>
      </div>
    );
  }
  return (
    <Procession
      walkers={latest.map((w) => ({ name: w.name, appearance: w.appearance, href: `/${lang}/w/${w.id}` }))}
      height={170}
    />
  );
}
