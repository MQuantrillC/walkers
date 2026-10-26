"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";

export type AuthState =
  // Accounts aren't switched on (no Supabase keys yet).
  | { status: "unavailable" }
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; userId: string; profile: Profile };

// What the header's account menu shows, from the Google account.
export type Profile = { name: string; email: string; avatarUrl: string | null };

type AuthContextValue = {
  auth: AuthState;
  // Starts Google sign-in, returning to `next` (a same-site path) afterwards.
  signIn: (next: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Same on server and client, so the first render hydrates cleanly; the
  // real session arrives from the browser client below.
  const [auth, setAuth] = useState<AuthState>(supabaseConfigured ? { status: "loading" } : { status: "unavailable" });

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    // Fires once straight away with the current session, then on every change.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(
        session
          ? { status: "signedIn", userId: session.user.id, profile: profileOf(session.user) }
          : { status: "signedOut" },
      );
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (next: string) => {
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    await getBrowserSupabase()?.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  }, []);

  const signOut = useCallback(async () => {
    await getBrowserSupabase()?.auth.signOut();
  }, []);

  return <AuthContext value={{ auth, signIn, signOut }}>{children}</AuthContext>;
}

function profileOf(user: User): Profile {
  const meta = user.user_metadata ?? {};
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const email = user.email ?? "";
  const avatar = text(meta.avatar_url) || text(meta.picture);
  return {
    name: text(meta.full_name) || text(meta.name) || email.split("@")[0],
    email,
    avatarUrl: avatar.startsWith("https://") ? avatar : null,
  };
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
