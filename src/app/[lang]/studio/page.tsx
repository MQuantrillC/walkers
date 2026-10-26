import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Studio } from "./Studio";

export const metadata: Metadata = { title: "Studio · WALKERS", robots: { index: false } };

// Developer tool for checking the walk cycle and outfits; not part of the
// public site.
export default function StudioPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Studio />;
}
