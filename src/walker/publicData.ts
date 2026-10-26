import "server-only";
import { getPublicSupabase } from "@/lib/supabase/server";
import { PUBLIC_WALKER_COLUMNS, isWalkerId, toPublicWalker, type PublicWalker } from "./records";

// Reads made as an anonymous visitor, so they can only ever see published
// walkers. Not cached: unpublishing or moderation takes effect immediately.

export async function getPublishedWalker(id: string): Promise<PublicWalker | null> {
  const supabase = getPublicSupabase();
  if (!supabase || !isWalkerId(id)) return null;
  const { data } = await supabase
    .from("walkers")
    .select(PUBLIC_WALKER_COLUMNS)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  return data ? toPublicWalker(data) : null;
}

export async function getLatestWalkers(limit: number): Promise<PublicWalker[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("walkers")
    .select(PUBLIC_WALKER_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(toPublicWalker);
}

export type GalleryOrder = "everyone" | "latest";
export type GalleryPage = { walkers: PublicWalker[]; nextOffset: number | null };

export const GALLERY_PAGE_SIZE = 24;

// Escape LIKE wildcards so a search for "50%" means the literal text.
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => "\\" + c);

// One page of the public gallery. "everyone" walks in the order people
// joined; "latest" puts the newest first. `query` matches display names.
export async function getGalleryPage({
  order,
  query,
  offset,
}: {
  order: GalleryOrder;
  query: string;
  offset: number;
}): Promise<GalleryPage> {
  const supabase = getPublicSupabase();
  if (!supabase) return { walkers: [], nextOffset: null };
  const from = Math.max(0, Math.floor(offset));
  let request = supabase
    .from("walkers")
    .select(PUBLIC_WALKER_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: order === "everyone" })
    .order("id")
    // One extra row tells us whether another page exists.
    .range(from, from + GALLERY_PAGE_SIZE);
  const q = query.trim().slice(0, 24);
  if (q) request = request.ilike("display_name", `%${likeEscape(q)}%`);
  const { data } = await request;
  const rows = data ?? [];
  return {
    walkers: rows.slice(0, GALLERY_PAGE_SIZE).map(toPublicWalker),
    nextOffset: rows.length > GALLERY_PAGE_SIZE ? from + GALLERY_PAGE_SIZE : null,
  };
}
