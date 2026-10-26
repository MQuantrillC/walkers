-- Stage 4: one report per signed-in person per walker, and self-service
-- account deletion.

-- A signed-in visitor can report a given walker once. (Anonymous reports
-- have no reporter to compare, so the app also remembers reports per device.)
create unique index reports_once_per_reporter
  on public.reports (walker_id, reporter_id)
  where reporter_id is not null;

-- Deletes the caller's account. Their profile and walker go with it
-- (on delete cascade); reports they filed stay, without a reporter.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
