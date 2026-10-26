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

1. SQL Editor → run `supabase/migrations/20261026000000_init.sql`.
2. SQL Editor → run `supabase/tests/rls_check.sql`: expect 30 rows, all
   `passed = true` (choose "Run without RLS"; the script only creates and
   removes its own test data).
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
