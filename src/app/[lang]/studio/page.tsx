import type { Metadata } from "next";
import { Studio } from "./Studio";

export const metadata: Metadata = { title: "Studio · WALKERS" };

export default function StudioPage() {
  return <Studio />;
}
