import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "./config";

// Refreshes the visitor's session (if any) before the page renders and
// copies updated auth cookies onto `response`. Returns the response to send.
export async function refreshSession(request: NextRequest, response: NextResponse): Promise<NextResponse> {
  if (!supabaseConfigured) return response;
  let out = response;
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        // Rebuild a pass-through response so the refreshed cookies reach both
        // the page render and the browser. Redirects are kept as they are.
        if (!out.headers.has("location")) out = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) out.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) out.headers.set(key, value);
      },
    },
  });
  // Verifies the session token and refreshes it when it's about to expire.
  await supabase.auth.getClaims();
  return out;
}
