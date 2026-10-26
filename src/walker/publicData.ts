import "server-only";
import { cache } from "react";
import { getPublicSupabase } from "@/lib/supabase/server";
import { PUBLIC_WALKER_COLUMNS, isWalkerId, toPublicWalker, type PublicWalker } from "./records";

// Reads made as an anonymous visitor, so they can only ever see published
// walkers. Not cached: unpublishing or moderation takes effect immediately.
// A failed read throws (to the page's error screen) rather than looking
// like an empty gallery or a deleted avatar.

function check(error: { message: string } | null) {
  if (error) throw new Error(`Couldn't read walkers: ${error.message}`);
}

// Shared within one request: the page, its metadata and its preview image
// all ask for the same walker.
export const getPublishedWalker = cache(async (id: string): Promise<PublicWalker | null> => {
  const supabase = getPublicSupabase();
  if (!supabase || !isWalkerId(id)) return null;
  const { data, error } = await supabase
    .from("walkers")
    .select(PUBLIC_WALKER_COLUMNS)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  check(error);
  return data ? toPublicWalker(data) : null;
});

export async function getLatestWalkers(limit: number): Promise<PublicWalker[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("walkers")
    .select(PUBLIC_WALKER_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  check(error);
  return (data ?? []).map(toPublicWalker);
}

// Every published walker's id and last change, for the sitemap.
export async function listPublishedWalkers(limit = 5000): Promise<{ id: string; updatedAt: string }[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("walkers")
    .select("id, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: true })
    .limit(limit);
  check(error);
  return (data ?? []).map((w) => ({ id: w.id as string, updatedAt: w.updated_at as string }));
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
  const { data, error } = await request;
  check(error);
  const rows = data ?? [];
  return {
    walkers: rows.slice(0, GALLERY_PAGE_SIZE).map(toPublicWalker),
    nextOffset: rows.length > GALLERY_PAGE_SIZE ? from + GALLERY_PAGE_SIZE : null,
  };
}
