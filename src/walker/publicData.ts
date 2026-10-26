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
