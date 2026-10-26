import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Procession } from "@/components/Procession";
import { SAMPLE_WALKERS } from "@/walker/samples";
import { getLatestWalkers } from "@/walker/publicData";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import styles from "./home.module.css";

// The Walk: newest published walkers first, topped up with the sample
// walkers so the procession never looks empty. The full gallery (paging,
// search, Latest) comes in Stage 4.
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
      <Suspense fallback={<Procession walkers={SAMPLE_WALKERS} height={170} />}>
        <LatestProcession lang={lang} />
      </Suspense>
    </div>
  );
}

const MIN_WALKERS = 8;

async function LatestProcession({ lang }: { lang: Locale }) {
  const latest = await getLatestWalkers(16);
  const walkers = [
    ...latest.map((w) => ({ name: w.name, appearance: w.appearance, href: `/${lang}/w/${w.id}` })),
    ...SAMPLE_WALKERS.slice(0, Math.max(0, MIN_WALKERS - latest.length)),
  ];
  return <Procession walkers={walkers} height={170} />;
}
