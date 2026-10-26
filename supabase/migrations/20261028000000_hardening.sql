-- Pre-launch hardening.

-- A hidden walker stays with its owner: deleting it would let them publish
-- a new one straight away, undoing the moderator's decision. Moderators can
-- still delete it, and deleting the whole account still removes it.
drop policy "Owners and moderators delete walkers" on public.walkers;

create policy "Owners and moderators delete walkers"
  on public.walkers for delete
  to authenticated
  using (
    (owner_id = (select auth.uid()) and status <> 'hidden')
    or (select public.is_admin())
  );

-- Anonymous reports are limited (signed-in people can report each walker
-- once already), so a script can't bury real reports in the queue: at most
-- 5 an hour per walker and 100 an hour in all.
create index reports_anonymous_recent_idx
  on public.reports (created_at)
  where reporter_id is null;

create function public.reports_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reporter_id is null and (
    (select count(*) from public.reports r
      where r.reporter_id is null and r.walker_id = new.walker_id
        and r.created_at > now() - interval '1 hour') >= 5
    or (select count(*) from public.reports r
      where r.reporter_id is null and r.created_at > now() - interval '1 hour') >= 100
  ) then
    raise exception 'Too many reports, try again later' using errcode = '54000';
  end if;
  return new;
end;
$$;

revoke execute on function public.reports_before_insert() from public, anon, authenticated;

create trigger reports_before_insert
  before insert on public.reports
  for each row execute function public.reports_before_insert();
