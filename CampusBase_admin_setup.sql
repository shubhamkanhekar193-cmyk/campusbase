-- =====================================================================
-- CampusBase — COMPLETE Supabase setup (tables, security, storage, 2 ADMIN LOGINS)
-- Run this ONE file in Supabase -> SQL Editor.  Safe to re-run.
--
-- BEFORE RUNNING: scroll to the very bottom ("STEP: CREATE THE 2 ADMIN LOGINS")
-- and put your 2 admin emails + passwords there.
-- =====================================================================

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

-- (admin accounts are created at the very bottom of this file)

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


-- =====================================================================
-- STEP: CREATE THE 2 ADMIN LOGINS   (edit the 6 values marked  <== EDIT)
-- These two accounts are created already-confirmed, so they can log in
-- immediately with "Admin Login" (email + password). Max 2 admins, always.
-- Re-running with a new password simply resets that admin's password.
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

create or replace function public.cb_make_admin(p_email text, p_pass text, p_name text) returns void
language plpgsql security definer set search_path = public, auth, extensions as $$
declare uid uuid;
begin
  p_email := lower(trim(p_email));
  select id into uid from auth.users where lower(email) = p_email;
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', p_email,
      crypt(p_pass, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('name', p_name), now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', p_email, 'email_verified', true),
      'email', uid::text, now(), now(), now());
  else
    update auth.users set encrypted_password = crypt(p_pass, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()) where id = uid;
  end if;
  insert into public.admins (email) select p_email where not exists (select 1 from public.admins where lower(email) = p_email);
  insert into public.profiles (id, name, email) values (uid, p_name, p_email)
    on conflict (id) do update set name = excluded.name, email = excluded.email;
end $$;
revoke all on function public.cb_make_admin(text, text, text) from public, anon, authenticated;

do $$
declare
  a1_email text := 'shubhamkanhekar193@gmail.com';   -- <== EDIT  Admin 1 email
  a1_pass  text := 'shubhamk@1';         -- <== EDIT  Admin 1 password (min 8 chars)
  a1_name  text := 'Shubham Kanhekar';             -- <== EDIT  Admin 1 name
  a2_email text := 'raviavdhut74@gmail.com';   -- <== EDIT  Admin 2 email
  a2_pass  text := 'ravi@123';         -- <== EDIT  Admin 2 password (min 8 chars)
  a2_name  text := 'Ravi Avdhut';                  -- <== EDIT  Admin 2 name
begin
  if a1_email like 'CHANGE_ME%' or a2_email like 'CHANGE_ME%' or a1_pass like 'CHANGE_ME%' or a2_pass like 'CHANGE_ME%' then
    raise exception 'Please edit the 2 admin emails and passwords in this block first, then run again.';
  end if;
  if length(a1_pass) < 8 or length(a2_pass) < 8 or lower(a1_email) = lower(a2_email) then
    raise exception 'Passwords need 8+ characters and the two admin emails must be different.';
  end if;
  delete from public.admins where lower(email) not in (lower(a1_email), lower(a2_email));  -- keep exactly these 2
  perform public.cb_make_admin(a1_email, a1_pass, a1_name);
  perform public.cb_make_admin(a2_email, a2_pass, a2_name);
end $$;

drop function if exists public.cb_make_admin(text, text, text);
-- Check:  select email from public.admins;   -> must show exactly your 2 admins
