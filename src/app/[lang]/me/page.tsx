import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { MyWalker } from "./MyWalker";

export async function generateMetadata({ params }: PageProps<"/[lang]/me">): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: `${getDictionary(lang).me.title} · WALKERS` } : {};
}

export default function MePage() {
  return <MyWalker />;
}
