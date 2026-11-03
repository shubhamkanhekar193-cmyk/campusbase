# CampusBase — cleaned project package

This package keeps the current CampusBase portal and removes duplicate/legacy pages and
conflicting setup scripts from the original ZIP.

## Files
- `index.html` — default website entry point (current portal UI)
- `portal.js`, `portal.css`, `style.css`, `bg.jpg` — portal logic and styling
- `supabase.js` — Supabase client configuration
- `supabase_setup_all.sql` — combined database, security, storage, and admin setup

## Required setup before running
1. Open `supabase.js`.
2. Replace `https://YOUR-PROJECT.supabase.co` with your Supabase Project URL.
3. Replace `YOUR-ANON-PUBLIC-KEY` with the Supabase **anon/public** key.
   Never put the `service_role` key in browser code.
4. Open `supabase_setup_all.sql` in Supabase SQL Editor.
5. In the final admin-creation block, set strong, unique passwords for both admins.
   The admin emails are already set to:
   - shubhamkanhekar193@gmail.com
   - raviavdhut74@gmail.com
6. Run the SQL once, then deploy the contents of this folder with `index.html` at the site root.

## Important
- The SQL file contains password placeholders, not actual passwords. Choose passwords privately
  before running it; do not send passwords in chat or commit them to GitHub.
- Enable Email provider in Supabase Authentication.
- Configure the deployed website URL under Authentication → URL Configuration.
- This ZIP cannot be fully connected/tested against your Supabase project until your real
  Project URL and anon/public key are added.
- The original archive contained a second SQL setup file with hard-coded plaintext admin
  passwords. That file has deliberately been excluded for account security.
