import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Crowd } from "./Crowd";

export const metadata: Metadata = { title: "Crowd · WALKERS", robots: { index: false } };

// Developer tool: the walk with a crowd of random walkers (?n=50), to check
// it stays smooth. Not part of the public site.
export default function CrowdPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Crowd />;
}
