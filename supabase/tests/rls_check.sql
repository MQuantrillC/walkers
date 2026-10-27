-- Row-level security check for WALKERS. Paste into the Supabase SQL editor
-- and run. It creates two throwaway users (Ana and Ben), acts as each of
-- them and as a signed-out visitor, records whether each action was allowed
-- or blocked as intended, deletes everything it created, and finishes with
-- a pass/fail table. Every row should say passed = true.

-- Clean up anything left by an earlier, interrupted run.
delete from auth.users where id in (
  'a0000000-0000-4000-8000-00000000000a',
  'b0000000-0000-4000-8000-00000000000b'
);
drop schema if exists rls_test cascade;

create schema rls_test;
create table rls_test.results (n serial primary key, test text, passed boolean, detail text);
grant usage on schema rls_test to anon, authenticated;
grant insert, select on rls_test.results to anon, authenticated;
grant usage on sequence rls_test.results_n_seq to anon, authenticated;

-- Runs `stmt` as the current role and records whether it succeeded as
-- expected. RLS hides rows rather than raising errors, so `rows` checks how
-- many rows a statement saw or changed.
create function rls_test.expect(test text, stmt text, should_succeed boolean, rows int default null)
returns void
language plpgsql
as $$
declare
  affected int;
begin
  execute stmt;
  get diagnostics affected = row_count;
  if not should_succeed then
    insert into rls_test.results (test, passed, detail) values (test, false, 'was allowed but should be blocked');
  elsif rows is not null and affected <> rows then
    insert into rls_test.results (test, passed, detail) values (test, false, format('saw %s rows, expected %s', affected, rows));
  else
    insert into rls_test.results (test, passed, detail) values (test, true, null);
  end if;
exception when others then
  insert into rls_test.results (test, passed, detail) values (test, not should_succeed, sqlerrm);
end;
$$;
grant execute on function rls_test.expect(text, text, boolean, int) to anon, authenticated;

create function rls_test.act_as(who text)
returns void
language plpgsql
as $$
begin
  if who = 'anon' then
    perform set_config('request.jwt.claims', '{"role":"anon"}', false);
    perform set_config('role', 'anon', false);
  else
    perform set_config(
      'request.jwt.claims',
      json_build_object(
        'sub', case who when 'ana' then 'a0000000-0000-4000-8000-00000000000a' else 'b0000000-0000-4000-8000-00000000000b' end,
        'role', 'authenticated'
      )::text,
      false
    );
    perform set_config('role', 'authenticated', false);
  end if;
end;
$$;
grant execute on function rls_test.act_as(text) to anon, authenticated;

insert into auth.users (id, email, aud, role)
values
  ('a0000000-0000-4000-8000-00000000000a', 'ana@rls-test.invalid', 'authenticated', 'authenticated'),
  ('b0000000-0000-4000-8000-00000000000b', 'ben@rls-test.invalid', 'authenticated', 'authenticated');

-- Ana ------------------------------------------------------------------
select rls_test.act_as('ana');
select rls_test.expect('Ana creates her walker as a draft',
  $q$insert into public.walkers (display_name, appearance) values ('Ana', '{}')$q$, true, 1);
select rls_test.expect('Ana cannot create a second walker',
  $q$insert into public.walkers (display_name, appearance) values ('Ana 2', '{}')$q$, false);
select rls_test.expect('Ana cannot create a walker for someone else',
  $q$insert into public.walkers (owner_id, display_name, appearance) values ('b0000000-0000-4000-8000-00000000000b', 'Fake', '{}')$q$, false);
select rls_test.expect('Ana cannot read owner ids',
  $q$select owner_id from public.walkers$q$, false);
select rls_test.expect('Ana finds her own walker',
  $q$select * from public.get_my_walker()$q$, true, 1);
select rls_test.expect('Ana cannot hide her own walker',
  $q$update public.walkers set status = 'hidden' where display_name = 'Ana'$q$, false);
select rls_test.expect('Names longer than 24 characters are rejected',
  $q$update public.walkers set display_name = 'abcdefghijklmnopqrstuvwxyz' where display_name = 'Ana'$q$, false);
select rls_test.expect('Appearance must be an object',
  $q$update public.walkers set appearance = '[]' where display_name = 'Ana'$q$, false);

-- Ben, while Ana's walker is a draft ----------------------------------
select rls_test.act_as('ben');
select rls_test.expect('Ben cannot see Ana''s draft',
  $q$select id from public.walkers where display_name = 'Ana'$q$, true, 0);
select rls_test.expect('Ben cannot edit Ana''s walker',
  $q$update public.walkers set display_name = 'Hacked' where display_name = 'Ana'$q$, true, 0);
select rls_test.expect('Ben cannot delete Ana''s walker',
  $q$delete from public.walkers where display_name = 'Ana'$q$, true, 0);
select rls_test.expect('Ben gets no walker from get_my_walker',
  $q$select * from public.get_my_walker()$q$, true, 0);
select rls_test.expect('Ben cannot make himself a moderator',
  $q$update public.profiles set is_admin = true$q$, false);
select rls_test.expect('Ben cannot read Ana''s profile',
  $q$select * from public.profiles where id = 'a0000000-0000-4000-8000-00000000000a'$q$, true, 0);

-- Visitor --------------------------------------------------------------
select rls_test.act_as('anon');
select rls_test.expect('Visitors cannot see drafts',
  $q$select id from public.walkers where display_name = 'Ana'$q$, true, 0);
select rls_test.expect('Visitors cannot create walkers',
  $q$insert into public.walkers (display_name, appearance) values ('Anon', '{}')$q$, false);
select rls_test.expect('Visitors cannot call get_my_walker',
  $q$select * from public.get_my_walker()$q$, false);

-- Ana publishes ---------------------------------------------------------
select rls_test.act_as('ana');
select rls_test.expect('Ana publishes her walker',
  $q$update public.walkers set status = 'published' where display_name = 'Ana'$q$, true, 1);

select rls_test.act_as('anon');
select rls_test.expect('Visitors see a published walker',
  $q$select id, display_name, appearance, published_at from public.walkers where display_name = 'Ana' and published_at is not null$q$, true, 1);
select rls_test.expect('Visitors cannot edit a published walker',
  $q$update public.walkers set display_name = 'Hacked' where display_name = 'Ana'$q$, false);
select rls_test.expect('Visitors can report a published walker',
  $q$insert into public.reports (walker_id, reason) select id, 'name' from public.walkers where display_name = 'Ana'$q$, true, 1);
select rls_test.expect('Visitors cannot read reports',
  $q$select * from public.reports$q$, false);

select rls_test.act_as('ben');
select rls_test.expect('Ben sees Ana''s published walker',
  $q$select id from public.walkers where display_name = 'Ana'$q$, true, 1);
select rls_test.expect('Ben still cannot edit it',
  $q$update public.walkers set display_name = 'Hacked' where display_name = 'Ana'$q$, true, 0);
select rls_test.expect('Ben cannot read reports',
  $q$select * from public.reports$q$, true, 0);
select rls_test.expect('Non-moderators get nothing from the walker log',
  $q$select * from public.admin_walker_log()$q$, true, 0);

select rls_test.act_as('anon');
select rls_test.expect('Visitors cannot open the walker log',
  $q$select * from public.admin_walker_log()$q$, false);

-- Ben becomes a moderator and hides Ana's walker -------------------------
reset role;
update public.profiles set is_admin = true where id = 'b0000000-0000-4000-8000-00000000000b';

select rls_test.act_as('ben');
select rls_test.expect('A moderator reads reports',
  $q$select * from public.reports$q$, true, 1);
select rls_test.expect('A moderator sees who made each walker in the log',
  $q$select * from public.admin_walker_log() where owner_email = 'ana@rls-test.invalid'$q$, true, 1);
select rls_test.expect('A moderator hides a walker',
  $q$update public.walkers set status = 'hidden' where display_name = 'Ana'$q$, true, 1);

select rls_test.act_as('ana');
select rls_test.expect('Ana cannot republish a hidden walker',
  $q$update public.walkers set status = 'published' where display_name = 'Ana'$q$, false);

select rls_test.act_as('anon');
select rls_test.expect('Visitors no longer see the hidden walker',
  $q$select id from public.walkers where display_name = 'Ana'$q$, true, 0);

select rls_test.act_as('ana');
select rls_test.expect('Ana cannot delete her hidden walker to start over',
  $q$delete from public.walkers where display_name = 'Ana'$q$, true, 0);

select rls_test.act_as('ben');
select rls_test.expect('A moderator deletes the hidden walker',
  $q$delete from public.walkers where display_name = 'Ana'$q$, true, 1);

-- Reports and accounts (second migration) ---------------------------------
select rls_test.expect('Ana''s deleted walker is gone for moderators too',
  $q$select id from public.walkers where display_name = 'Ana'$q$, true, 0);
select rls_test.expect('Ben creates a walker and publishes it',
  $q$insert into public.walkers (display_name, appearance, status) values ('Ben', '{}', 'published')$q$, true, 1);

select rls_test.act_as('ana');
select rls_test.expect('Ana reports Ben''s walker',
  $q$insert into public.reports (walker_id, reason) select id, 'drawing' from public.walkers where display_name = 'Ben'$q$, true, 1);
select rls_test.expect('Ana cannot report the same walker twice',
  $q$insert into public.reports (walker_id, reason) select id, 'drawing' from public.walkers where display_name = 'Ben'$q$, false);

select rls_test.act_as('anon');
select rls_test.expect('Visitors report Ben''s walker five times in an hour',
  $q$insert into public.reports (walker_id, reason) select w.id, 'other' from public.walkers w, generate_series(1, 5) where w.display_name = 'Ben'$q$, true, 5);
select rls_test.expect('A sixth anonymous report that hour is refused',
  $q$insert into public.reports (walker_id, reason) select id, 'other' from public.walkers where display_name = 'Ben'$q$, false);
select rls_test.expect('Visitors cannot delete accounts',
  $q$select public.delete_my_account()$q$, false);

select rls_test.act_as('ben');
select rls_test.expect('Ben deletes his own account',
  $q$select public.delete_my_account()$q$, true);

reset role;
select rls_test.expect('Ben''s account and walker are gone',
  $q$select 1 from auth.users u where u.id = 'b0000000-0000-4000-8000-00000000000b' union all select 1 from public.walkers w where w.display_name = 'Ben'$q$, true, 0);
select rls_test.expect('Ana still exists',
  $q$select 1 from auth.users u where u.id = 'a0000000-0000-4000-8000-00000000000a'$q$, true, 1);

-- Tidy up and show the results -------------------------------------------
reset role;
select set_config('request.jwt.claims', '', false);
delete from auth.users where id in (
  'a0000000-0000-4000-8000-00000000000a',
  'b0000000-0000-4000-8000-00000000000b'
);
create temp table rls_results as select n, test, passed, detail from rls_test.results;
drop schema rls_test cascade;
select n, passed, test, detail from rls_results order by n;
