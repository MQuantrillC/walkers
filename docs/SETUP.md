# Setup: Supabase and Google sign-in

Only non-secret values belong in this file. Secrets (database password,
Supabase secret key, Google client secret) live in Supabase and a password
manager, never in the repository.

## Supabase

- Project: `ngjehtsvloyblzrtpuok`
- URL: `https://ngjehtsvloyblzrtpuok.supabase.co`
- The app needs only the URL and the **publishable** key, in `.env.local`
  (see `.env.example`). The secret key is never used by the app.

Database:

1. SQL Editor → run each file in `supabase/migrations/` in order
   (`20261026000000_init.sql`, then `20261027000000_reports_and_accounts.sql`).
2. SQL Editor → run `supabase/tests/rls_check.sql`: expect 38 rows, all
   `passed = true` (choose "Run without RLS"; the script only creates and
   removes its own test data).
3. Make yourself a moderator (after signing in once):
   `update public.profiles set is_admin = true where id = (select id from auth.users where email = 'YOUR_EMAIL');`
   The moderation page is `/es/admin` (or `/en/admin`).
3. Locally, `npm run check:rls` runs the same checks against an in-process
   Postgres.

Auth → URL Configuration:

- Site URL: `http://localhost:3000` (production URL once deployed)
- Redirect URLs: `http://localhost:3000/auth/callback` (add the production
  and Vercel preview callbacks when deploying)

Auth → Sign In / Providers → Google: enabled with the client ID below and
its client secret.

## Google Cloud

- Project: `walkers-512817`
- OAuth client (Web application) "WALKERS web"
  - Client ID: `317571523880-0thrilrv2duu3duuma8p5ucsu02tcqvh.apps.googleusercontent.com`
  - Authorized JavaScript origins: `http://localhost:3000`
  - Authorized redirect URIs: `https://ngjehtsvloyblzrtpuok.supabase.co/auth/v1/callback`
- Google Auth Platform → Audience: publish the app (otherwise only listed
  test users can sign in).

When deploying, add the production origin to the OAuth client and the
production callback to Supabase's redirect URLs.

## Deploying (Vercel)

1. vercel.com → Add New → Project → import `MQuantrillC/walkers`.
2. Environment variables (Production and Preview):
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Deploy. Every push to `main` redeploys automatically.
4. With the production URL (e.g. `https://walkers-xyz.vercel.app`):
   - Supabase → Auth → URL Configuration: set Site URL to it, and add
     `<url>/auth/callback` and `https://*-mquantrillc.vercel.app/auth/callback`
     (previews) to Redirect URLs. Keep the localhost entries for development.
   - Google Cloud → Clients → WALKERS web: add the URL to Authorized
     JavaScript origins.
   - Google Auth Platform → Branding: home page `<url>/es`, privacy policy
     `<url>/es/privacy`, authorized domain `vercel.app` (or your own domain).
     Then Audience → Publish app.
