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
