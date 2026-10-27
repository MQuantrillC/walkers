-- The moderators' log: every walker in any status, newest first, with who
-- made it (their Google name and email from auth.users) and when.
--
-- Security definer so it can read auth.users, which clients never can; it
-- returns nothing at all unless the caller is a moderator.

create function public.admin_walker_log()
returns table (
  id uuid,
  display_name text,
  appearance jsonb,
  status text,
  created_at timestamptz,
  published_at timestamptz,
  updated_at timestamptz,
  owner_name text,
  owner_email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    w.id,
    w.display_name,
    w.appearance,
    w.status,
    w.created_at,
    w.published_at,
    w.updated_at,
    coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
    u.email
  from public.walkers w
  join auth.users u on u.id = w.owner_id
  where (select public.is_admin())
  order by w.created_at desc
  limit 500;
$$;

revoke execute on function public.admin_walker_log() from public, anon;
grant execute on function public.admin_walker_log() to authenticated;
