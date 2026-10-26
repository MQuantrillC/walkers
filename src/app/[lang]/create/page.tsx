import type { Metadata } from "next";
import { CreatorPage } from "@/creator/Creator";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/create">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return pageMetadata(lang, "/create", { title: t.meta.create, description: t.meta.description });
}

export default function CreatePage() {
  return <CreatorPage />;
}
