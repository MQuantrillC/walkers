import type { Metadata } from "next";
import { Moderation } from "./Moderation";

export const metadata: Metadata = { title: "Moderation · WALKERS", robots: { index: false } };

export default function AdminPage() {
  return <Moderation />;
}
