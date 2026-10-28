import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

// Only paths on this site, so the sign-in link can't be turned into a
// redirect to another website. Browsers drop tabs and line breaks from URLs
// ("/\t/evil.com" becomes "//evil.com"), so control characters and
// backslashes are refused outright, and the resolved address must still be
// on this origin.
function safeNext(value: string | null, origin: string): URL {
  const home = new URL("/", origin);
  if (!value || !value.startsWith("/") || /[\u0000-\u001f\u007f\\]/.test(value)) return home;
  try {
    const url = new URL(value, origin);
    return url.origin === origin ? url : home;
  } catch {
    return home;
  }
}

// Google sends the visitor back here via Supabase with a one-time code,
// which becomes a session stored in cookies.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"), origin);
  // A retry after a failed attempt shouldn't keep the old failure.
  next.searchParams.delete("signin");
  const code = searchParams.get("code");
  const supabase = await getServerSupabase();

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(next);
    // Shows up in the deployment's logs; never includes the code itself.
    console.error("Sign-in failed:", error.code ?? error.name, error.message);
  } else {
    console.error("Sign-in failed:", searchParams.get("error") ?? "no code", searchParams.get("error_description") ?? "");
  }

  const failed = new URL(next);
  failed.searchParams.set("signin", "failed");
  return NextResponse.redirect(failed);
}
