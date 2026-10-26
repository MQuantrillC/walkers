"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { validateAppearance, validateDisplayName } from "./validate";
import { toMyWalker, MY_WALKER_COLUMNS, type MyWalker, type PublicWalker } from "./records";
import { getLatestWalkers } from "./publicData";

// Every write goes through here so the full appearance validation runs on
// the server, not just in the browser. Ownership and publication rules are
// enforced again by row-level security in the database.

export type ActionError = "unavailable" | "signedOut" | "invalidName" | "invalid" | "hidden" | "notFound" | "failed";
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

async function signedInClient(): Promise<{ supabase: SupabaseClient } | { error: "unavailable" | "signedOut" }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { error: "unavailable" };
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return { error: "signedOut" };
  return { supabase };
}

// Postgres errors the database raises on purpose.
function mapError(error: { code?: string } | null): ActionError {
  if (error?.code === "42501") return "hidden";
  if (error?.code === "23514") return "invalid";
  return "failed";
}

// Newest published walkers, for showing a new walker among the crowd.
export async function listLatestWalkers(): Promise<PublicWalker[]> {
  return getLatestWalkers(12);
}

export async function getMyWalker(): Promise<ActionResult<MyWalker | null>> {
  const ctx = await signedInClient();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { data, error } = await ctx.supabase.rpc("get_my_walker").maybeSingle<Record<string, unknown>>();
  if (error) return { ok: false, error: "failed" };
  return { ok: true, data: data ? toMyWalker(data) : null };
}

export async function saveWalker(input: {
  name: unknown;
  appearance: unknown;
  publish?: boolean;
}): Promise<ActionResult<MyWalker>> {
  const name = validateDisplayName(input.name);
  if (!name.ok) return { ok: false, error: "invalidName" };
  const appearance = validateAppearance(input.appearance);
  if (!appearance.ok) return { ok: false, error: "invalid" };

  const ctx = await signedInClient();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { supabase } = ctx;

  const existing = await supabase.rpc("get_my_walker").maybeSingle<{ id: string; status: string }>();
  if (existing.error) return { ok: false, error: "failed" };

  const fields = { display_name: name.value, appearance: appearance.value };
  if (existing.data) {
    if (existing.data.status === "hidden") return { ok: false, error: "hidden" };
    const { data, error } = await supabase
      .from("walkers")
      .update(input.publish ? { ...fields, status: "published" } : fields)
      .eq("id", existing.data.id)
      .select(MY_WALKER_COLUMNS)
      .single();
    if (error || !data) return { ok: false, error: mapError(error) };
    return { ok: true, data: toMyWalker(data) };
  }

  const { data, error } = await supabase
    .from("walkers")
    .insert({ ...fields, status: input.publish ? "published" : "draft" })
    .select(MY_WALKER_COLUMNS)
    .single();
  if (error || !data) return { ok: false, error: mapError(error) };
  return { ok: true, data: toMyWalker(data) };
}

export async function setPublished(published: boolean): Promise<ActionResult<MyWalker>> {
  const ctx = await signedInClient();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const existing = await ctx.supabase.rpc("get_my_walker").maybeSingle<{ id: string; status: string }>();
  if (existing.error) return { ok: false, error: "failed" };
  if (!existing.data) return { ok: false, error: "notFound" };
  if (existing.data.status === "hidden") return { ok: false, error: "hidden" };

  const { data, error } = await ctx.supabase
    .from("walkers")
    .update({ status: published ? "published" : "draft" })
    .eq("id", existing.data.id)
    .select(MY_WALKER_COLUMNS)
    .single();
  if (error || !data) return { ok: false, error: mapError(error) };
  return { ok: true, data: toMyWalker(data) };
}

export async function deleteMyWalker(): Promise<ActionResult<null>> {
  const ctx = await signedInClient();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const existing = await ctx.supabase.rpc("get_my_walker").maybeSingle<{ id: string }>();
  if (existing.error) return { ok: false, error: "failed" };
  if (!existing.data) return { ok: false, error: "notFound" };

  const { error } = await ctx.supabase.from("walkers").delete().eq("id", existing.data.id);
  if (error) return { ok: false, error: "failed" };
  return { ok: true, data: null };
}
