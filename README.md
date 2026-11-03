# CampusBase — Supabase connected site

Supabase = backend (login, database, file storage). The website files are hosted on Vercel / Netlify / GitHub Pages.

## 1. Supabase project
1. supabase.com -> New project.
2. SQL Editor -> open `supabase_setup_all.sql`, **change the 2 admin emails at the top**, paste & Run.
3. Authentication -> Providers -> Email = ON (keep "Confirm email" ON).

## 2. Connect the site
Open `supabase.js` and fill in (Project Settings -> API):
- `SUPABASE_URL`  = Project URL
- `SUPABASE_ANON_KEY` = anon public key  (NEVER put the service_role key here)

## 3. Deploy
Upload ALL files in this folder (index.html at the root) to Vercel / Netlify / GitHub Pages.

## 4. Allow your site URL
Supabase -> Authentication -> URL Configuration:
- Site URL = your deployed URL (e.g. https://yourname.vercel.app)
- Redirect URLs = same URL

## 5. Admins
The 2 admins register normally on the site (Sign up) with the emails from step 1, confirm the email,
then use "Admin Login" -> "Upload Files". Students cannot upload/delete (database blocks it).

Telegram + WhatsApp links are ON; Instagram is OFF (see `SOCIAL` at top of `portal.js`).
