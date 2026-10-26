import type { Metadata } from "next";
import { CreatorPage } from "@/creator/Creator";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/create">): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: getDictionary(lang).meta.create } : {};
}

export default function CreatePage() {
  return <CreatorPage />;
}
