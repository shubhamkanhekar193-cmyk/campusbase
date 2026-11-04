-- =====================================================================
-- CampusBase v3 update: UNIVERSITY LOCK + 2 PREMIUM PLANS (Silver / Gold)
-- Run in Supabase -> SQL Editor. Safe to re-run.
-- (Already included at the bottom of supabase_setup_all.sql for fresh installs.)
-- =====================================================================

-- 1) New columns
alter table public.profiles  add column if not exists plan text not null default 'free' check (plan in ('free','silver','gold'));
alter table public.profiles  add column if not exists plan_expires timestamptz;
alter table public.resources add column if not exists plan text not null default 'free' check (plan in ('free','silver','gold'));

-- 2) Helpers: the logged-in student's university and *effective* plan (expired plan = free)
create or replace function public.my_uni() returns text
language sql security definer stable set search_path = public as $$ select university from public.profiles where id = auth.uid() $$;
create or replace function public.my_plan() returns text
language sql security definer stable set search_path = public as $$
  select case when plan <> 'free' and (plan_expires is null or plan_expires > now()) then plan else 'free' end
  from public.profiles where id = auth.uid() $$;
grant execute on function public.my_uni(), public.my_plan() to authenticated;

-- 3) UNIVERSITY LOCK (enforced in the database, not just the screen):
--    a logged-in student only receives files of THEIR university, and only those their plan allows. Admins see everything.
drop policy if exists "anyone reads resources" on public.resources;
drop policy if exists "read own university resources" on public.resources;
create policy "read own university resources" on public.resources for select to authenticated
using (
  public.is_admin()
  or ( university = public.my_uni()
       and ( plan = 'free'
          or (plan = 'silver' and public.my_plan() in ('silver','gold'))
          or (plan = 'gold'   and public.my_plan() = 'gold') ) )
);

-- 4) Students may NOT change their own university or plan (only name, branch, year, photo)
revoke update on public.profiles from authenticated;
grant update (name, branch, year, photo) on public.profiles to authenticated;

-- 5) Admins can read all profiles (needed for the premium members list)
drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles" on public.profiles for select to authenticated using (public.is_admin());

-- 6) Admin-only: activate / remove a student's premium plan by PRN or email
create or replace function public.set_plan(p_who text, p_plan text, p_days int) returns text
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_plan not in ('free','silver','gold') then raise exception 'Bad plan'; end if;
  update public.profiles
     set plan = p_plan,
         plan_expires = case when p_plan = 'free' then null else now() + make_interval(days => greatest(p_days, 1)) end
   where upper(prn) = upper(trim(p_who)) or lower(email) = lower(trim(p_who));
  get diagnostics n = row_count;
  if n = 0 then raise exception 'No student with that PRN / email'; end if;
  return p_plan;
end $$;
revoke all on function public.set_plan(text, text, int) from public, anon;
grant execute on function public.set_plan(text, text, int) to authenticated;

-- To fix a student's wrong university (students cannot change it themselves):
--   update public.profiles set university = 'SPPU' where prn = 'THEIR_PRN';
