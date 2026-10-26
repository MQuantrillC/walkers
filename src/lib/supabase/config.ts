// Public Supabase settings. Both are safe in the browser: what each visitor
// can read or change is enforced by row-level security in the database.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

// Lets the app run (without accounts) before the keys are filled in.
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
