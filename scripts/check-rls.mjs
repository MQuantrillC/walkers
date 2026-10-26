// Applies every migration in supabase/migrations and runs
// supabase/tests/rls_check.sql against PGlite (Postgres running in-process),
// with a minimal stand-in for Supabase's auth schema and API roles. Catches
// broken SQL and row-level security mistakes before they reach Supabase.
// Run with: npm run check:rls
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const db = new PGlite();

await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant anon, authenticated, service_role to postgres;
  grant usage on schema public to anon, authenticated;
  create schema auth;
  grant usage on schema auth to anon, authenticated;
  create table auth.users (id uuid primary key, email text, aud text, role text, instance_id uuid);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
  $$;
  grant execute on function auth.uid() to anon, authenticated;
`);

const migrations = join(root, "supabase", "migrations");
for (const file of readdirSync(migrations).filter((f) => f.endsWith(".sql")).sort()) {
  await db.exec(readFileSync(join(migrations, file), "utf8"));
  console.log(`applied ${file}`);
}

const results = await db.exec(readFileSync(join(root, "supabase", "tests", "rls_check.sql"), "utf8"));
const rows = results.at(-1).rows;
let failed = 0;
for (const r of rows) {
  if (!r.passed) failed++;
  console.log(`${r.passed ? "ok  " : "FAIL"} ${String(r.n).padStart(2)} ${r.test}${r.passed ? "" : `  [${r.detail}]`}`);
}
console.log(`\n${rows.length - failed}/${rows.length} passed`);
process.exit(failed ? 1 : 0);
