import type { Metadata } from "next";
import { CreatorPage } from "@/creator/Creator";

export const metadata: Metadata = { title: "Create · WALKERS" };

export default function CreatePage() {
  return <CreatorPage />;
}
