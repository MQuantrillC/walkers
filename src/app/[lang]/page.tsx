import Link from "next/link";
import { notFound } from "next/navigation";
import { Procession } from "@/components/Procession";
import { SAMPLE_WALKERS } from "@/walker/samples";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import styles from "./home.module.css";

// Placeholder for The Walk: the real gallery of published walkers arrives
// with persistence (Stage 3) and the full procession (Stage 4).
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
      <Procession walkers={SAMPLE_WALKERS} height={170} />
    </div>
  );
}
