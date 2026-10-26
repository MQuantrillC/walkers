import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { WalkerStage } from "@/components/WalkerStage";
import { ShareButton } from "@/components/ShareButton";
import { ReportButton } from "@/components/ReportButton";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getPublishedWalker } from "@/walker/publicData";
import styles from "./profile.module.css";

export async function generateMetadata({ params }: PageProps<"/[lang]/w/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLocale(lang)) return {};
  const walker = await getPublishedWalker(id);
  const t = getDictionary(lang);
  return walker
    ? { title: `${walker.name} · WALKERS`, description: t.profile.shareText(walker.name) }
    : { title: t.meta.title, robots: { index: false } };
}

// A published walker's public page. Read fresh on every request, so
// unpublishing or moderation takes effect straight away.
export default function ProfilePage({ params }: PageProps<"/[lang]/w/[id]">) {
  return (
    <Suspense fallback={<div className={styles.page} aria-busy="true" />}>
      <Profile params={params} />
    </Suspense>
  );
}

async function Profile({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const walker = await getPublishedWalker(id);

  if (!walker) {
    return (
      <div className={styles.page}>
        <p className={styles.note}>{t.profile.notFound}</p>
        <Link className={styles.primary} href={`/${lang}/create`}>
          {t.profile.createYours}
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <WalkerStage appearance={walker.appearance} height={340} title={walker.name} />
      <h1 className={styles.name}>{walker.name}</h1>
      <p className={styles.note}>{t.profile.walkingSince(formatDate(walker.publishedAt, lang))}</p>
      <div className={styles.actions}>
        <ShareButton path={`/${lang}/w/${walker.id}`} title={t.profile.shareText(walker.name)} />
        <Link className={styles.primary} href={`/${lang}/create`}>
          {t.profile.createYours}
        </Link>
      </div>
      <ReportButton walkerId={walker.id} />
    </div>
  );
}

function formatDate(iso: string, lang: Locale) {
  return new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}
