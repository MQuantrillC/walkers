"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { cleanDisplayName, sanitizeAppearance } from "./validate";
import { isWalkerId, type WalkerStatus } from "./records";
import type { WalkerAppearance } from "./appearance";

// Reporting (anyone) and the moderation queue (moderators only). Row-level
// security enforces who may do what; these checks just give clear answers.

export type ReportReason = "name" | "drawing" | "other";
const REASONS: readonly ReportReason[] = ["name", "drawing", "other"];

export async function reportWalker(input: {
  walkerId: string;
  reason: ReportReason;
  details?: string;
}): Promise<{ ok: boolean; duplicate?: boolean }> {
  const supabase = await getServerSupabase();
  if (!supabase || !isWalkerId(input.walkerId) || !REASONS.includes(input.reason)) return { ok: false };
  const details = typeof input.details === "string" ? input.details.trim().slice(0, 500) || null : null;
  const { error } = await supabase
    .from("reports")
    .insert({ walker_id: input.walkerId, reason: input.reason, details });
  if (error?.code === "23505") return { ok: true, duplicate: true };
  return { ok: !error };
}

export type QueueItem = {
  walker: { id: string; name: string; appearance: WalkerAppearance; status: WalkerStatus };
  reports: { id: string; reason: ReportReason; details: string | null; createdAt: string }[];
};

async function moderatorClient(): Promise<SupabaseClient | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.rpc("is_admin");
  return data === true ? supabase : null;
}

// Reported walkers, most-reported first. null when the caller isn't a moderator.
export async function getModerationQueue(): Promise<QueueItem[] | null> {
  const supabase = await moderatorClient();
  if (!supabase) return null;
  const { data: reports } = await supabase
    .from("reports")
    .select("id, walker_id, reason, details, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (!reports?.length) return [];

  const ids = [...new Set(reports.map((r) => r.walker_id as string))];
  const { data: walkers } = await supabase
    .from("walkers")
    .select("id, display_name, appearance, status")
    .in("id", ids);

  const items = (walkers ?? []).map((w) => ({
    walker: {
      id: String(w.id),
      name: cleanDisplayName(w.display_name),
      appearance: sanitizeAppearance(w.appearance),
      status: (w.status === "published" || w.status === "hidden" ? w.status : "draft") as WalkerStatus,
    },
    reports: reports
      .filter((r) => r.walker_id === w.id)
      .map((r) => ({
        id: String(r.id),
        reason: r.reason as ReportReason,
        details: (r.details as string | null) ?? null,
        createdAt: String(r.created_at),
      })),
  }));
  return items.sort((a, b) => b.reports.length - a.reports.length);
}

export type ModerationAction = "hide" | "restore" | "delete" | "dismiss";

export async function moderate(walkerId: string, action: ModerationAction): Promise<{ ok: boolean }> {
  const supabase = await moderatorClient();
  if (!supabase || !isWalkerId(walkerId)) return { ok: false };
  let error;
  if (action === "hide" || action === "restore") {
    ({ error } = await supabase
      .from("walkers")
      .update({ status: action === "hide" ? "hidden" : "published" })
      .eq("id", walkerId));
  } else if (action === "delete") {
    ({ error } = await supabase.from("walkers").delete().eq("id", walkerId));
  } else {
    ({ error } = await supabase.from("reports").delete().eq("walker_id", walkerId));
  }
  return { ok: !error };
}

// Deletes the signed-in visitor's account, profile and walker.
export async function deleteMyAccount(): Promise<{ ok: boolean }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false };
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { ok: false };
  await supabase.auth.signOut();
  return { ok: true };
}
