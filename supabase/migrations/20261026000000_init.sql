-- WALKERS: profiles, walkers and reports, with row-level security.
--
-- Access model
--   * Anyone (anon or signed in) can read published walkers, but only the
--     public columns: never owner_id or anything from auth.users.
--   * A signed-in user owns at most one walker. They can create, edit,
--     publish, unpublish and delete it; nobody else can touch it.
--   * Moderators (profiles.is_admin, set by hand in the SQL editor) can see
--     everything and hide walkers. A hidden walker cannot be republished by
--     its owner, only deleted.
--   * Anyone can file a report; only moderators can read reports.
--
-- New tables are not exposed to the Data API automatically in this project,
-- so every privilege below is granted explicitly.

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Every new account gets a profile row.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Is the caller a moderator? Security definer so policies can use it
-- without granting access to other people's profile rows.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

create policy "Users read their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

-- ----------------------------------------------------------------- walkers

create table public.walkers (
  id uuid primary key default gen_random_uuid(),
  -- One walker per account. Defaults to the caller; clients cannot set it.
  owner_id uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  display_name text not null
    check (char_length(display_name) between 1 and 24)
    check (display_name = btrim(display_name))
    check (display_name !~ '[[:cntrl:]]'),
  -- Structured appearance (see src/walker/appearance.ts). The app validates
  -- it in full before saving; the database caps its size and shape.
  appearance jsonb not null
    check (jsonb_typeof(appearance) = 'object')
    check (octet_length(appearance::text) <= 100000),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'hidden')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index walkers_published_at_idx
  on public.walkers (published_at desc)
  where status = 'published';

alter table public.walkers enable row level security;

-- Keeps ownership and timestamps honest whoever writes, and stops owners
-- from un-hiding a walker a moderator removed.
create function public.walkers_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if old.status = 'hidden' and new.status <> 'hidden' and not public.is_admin() then
      raise exception 'This walker was hidden by a moderator and cannot be republished'
        using errcode = '42501';
    end if;
    new.owner_id := old.owner_id;
    new.created_at := old.created_at;
  end if;

  if new.status = 'published' then
    if tg_op = 'INSERT' or old.status <> 'published' then
      new.published_at := now();
    end if;
  else
    new.published_at := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger walkers_before_write
  before insert or update on public.walkers
  for each row execute function public.walkers_before_write();

create policy "Published walkers are public; owners and moderators see their own"
  on public.walkers for select
  to anon, authenticated
  using (
    status = 'published'
    or owner_id = (select auth.uid())
    or (select public.is_admin())
  );

create policy "Users create their own walker"
  on public.walkers for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and status in ('draft', 'published')
  );

create policy "Owners edit their walker but cannot hide it"
  on public.walkers for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and status in ('draft', 'published')
  );

-- WITH CHECK clauses of permissive policies are OR'ed together, so this one
-- must also require a moderator; `with check (true)` would let every owner
-- write any status, including 'hidden'.
create policy "Moderators can update any walker"
  on public.walkers for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Owners and moderators delete walkers"
  on public.walkers for delete
  to authenticated
  using (
    owner_id = (select auth.uid())
    or (select public.is_admin())
  );

-- The caller's own walker. Clients cannot read owner_id directly, so this
-- is how the app finds "my walker".
create function public.get_my_walker()
returns table (
  id uuid,
  display_name text,
  appearance jsonb,
  status text,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select w.id, w.display_name, w.appearance, w.status, w.published_at, w.created_at, w.updated_at
  from public.walkers w
  where w.owner_id = (select auth.uid());
$$;

-- ----------------------------------------------------------------- reports

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  walker_id uuid not null references public.walkers (id) on delete cascade,
  -- Null when the reporter wasn't signed in.
  reporter_id uuid default auth.uid() references auth.users (id) on delete set null,
  reason text not null check (reason in ('name', 'drawing', 'other')),
  details text check (char_length(details) <= 500),
  created_at timestamptz not null default now()
);

create index reports_walker_id_idx on public.reports (walker_id);

alter table public.reports enable row level security;

create policy "Anyone can report a published walker"
  on public.reports for insert
  to anon, authenticated
  with check (
    reporter_id is not distinct from (select auth.uid())
    and exists (select 1 from public.walkers w where w.id = walker_id and w.status = 'published')
  );

create policy "Moderators read reports"
  on public.reports for select
  to authenticated
  using ((select public.is_admin()));

create policy "Moderators resolve reports"
  on public.reports for delete
  to authenticated
  using ((select public.is_admin()));

-- -------------------------------------------------------------- privileges

-- Start from nothing, then grant exactly what the app needs.
revoke all on public.profiles, public.walkers, public.reports from anon, authenticated;

grant select on public.profiles to authenticated;

-- Public columns only: owner_id stays private.
grant select (id, display_name, appearance, status, published_at, created_at, updated_at)
  on public.walkers to anon, authenticated;
grant insert (display_name, appearance, status) on public.walkers to authenticated;
grant update (display_name, appearance, status) on public.walkers to authenticated;
grant delete on public.walkers to authenticated;

grant insert (walker_id, reason, details) on public.reports to anon, authenticated;
grant select, delete on public.reports to authenticated;

revoke execute on function public.get_my_walker() from public, anon;
grant execute on function public.get_my_walker() to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
