-- CampusBase: run this ONE file in Supabase -> SQL Editor (safe to re-run).
-- !! Before running: replace admin1@gmail.com / admin2@gmail.com below with your 2 admin emails !!

-- CampusBase: 2 admins + PDFs (Supabase SQL Editor me run karo)
-- 1) Neeche dono admin emails apni emails se badlo.

-- ===== Admins table (max 2) =====
create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security;

create or replace function public.limit_admins() returns trigger
language plpgsql as $$
begin
  if (select count(*) from public.admins) >= 2 then
    raise exception 'Maximum 2 admins allowed';
  end if;
  new.email := lower(new.email);
  return new;
end $$;

drop trigger if exists admins_limit on public.admins;
create trigger admins_limit before insert on public.admins
for each row execute function public.limit_admins();

insert into public.admins (email) values
  ('admin1@gmail.com'),   -- 👈 Admin 1
  ('admin2@gmail.com')    -- 👈 Admin 2
on conflict do nothing;

-- Admin sirf apni row dekh sakta hai; insert/update/delete ka policy nahi => koi 3rd admin app se nahi ban sakta
drop policy if exists "admin reads self" on public.admins;
create policy "admin reads self" on public.admins for select to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Verified-email admin check
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public, auth as $$
  select exists (
    select 1 from public.admins a
    join auth.users u on lower(u.email) = lower(a.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;

-- ===== Resources table =====
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  university text not null,
  branch text not null,
  year text not null,
  type text not null,
  title text not null check (char_length(title) <= 120),
  file_path text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);
alter table public.resources enable row level security;

drop policy if exists "anyone reads resources" on public.resources;
create policy "anyone reads resources" on public.resources for select using (true);
drop policy if exists "admins insert resources" on public.resources;
create policy "admins insert resources" on public.resources for insert to authenticated with check (public.is_admin());
drop policy if exists "admins delete resources" on public.resources;
create policy "admins delete resources" on public.resources for delete to authenticated using (public.is_admin());

-- ===== Storage bucket (public read, admin write) =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pdfs', 'pdfs', true, 20971520, array['application/pdf'])
on conflict (id) do update set public = true, file_size_limit = 20971520, allowed_mime_types = array['application/pdf'];

drop policy if exists "admins upload pdfs" on storage.objects;
create policy "admins upload pdfs" on storage.objects for insert to authenticated
with check (bucket_id = 'pdfs' and public.is_admin());
drop policy if exists "admins delete pdfs" on storage.objects;
create policy "admins delete pdfs" on storage.objects for delete to authenticated
using (bucket_id = 'pdfs' and public.is_admin());


-- CampusBase v2 add-on. Run AFTER setup.sql (setup.sql is NOT changed). Safe to re-run.

-- 1) Student profiles (PRN, name, university, branch, year, photo)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  prn text unique,
  name text not null default '',
  email text,
  university text, branch text, year text,
  photo text check (photo is null or length(photo) < 80000),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (name, university, branch, year, photo) on public.profiles to authenticated;  -- PRN can't be changed

-- 2) On every signup: create the student profile (PRN, name, university, branch, year)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, prn, name, email, university, branch, year)
  values (new.id, nullif(upper(m->>'prn'), ''), coalesce(nullif(m->>'name',''), nullif(m->>'full_name',''), split_part(new.email,'@',1)), new.email, m->>'university', m->>'branch', m->>'year');
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Profiles for accounts created before this script (e.g. via auth.html)
insert into public.profiles (id, name, email) select id, split_part(email,'@',1), email from auth.users on conflict (id) do nothing;

-- 3) Login by PRN: finds the email for a PRN, and SID search
create or replace function public.login_email(p text) returns text
language sql security definer stable set search_path = public as $$ select email from public.profiles where prn = upper(p) limit 1 $$;
revoke all on function public.login_email(text) from public;
grant execute on function public.login_email(text) to anon, authenticated;

create or replace function public.find_student(p_sid text) returns table (name text, branch text, year text, university text)
language sql security definer stable set search_path = public as $$
  select pr.name, pr.branch, pr.year, pr.university from public.profiles pr
  where pr.prn is not null and '@' || lower(regexp_replace(trim(pr.name), '\s+', '.', 'g')) = lower(p_sid) limit 1 $$;
revoke all on function public.find_student(text) from public;
grant execute on function public.find_student(text) to authenticated;

-- 4) Admins can upload ANY file type (setup.sql allowed only PDF)
update storage.buckets set allowed_mime_types = null where id = 'pdfs';
