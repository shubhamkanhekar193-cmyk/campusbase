# CampusBase — fixed package

## Deploy
1. `supabase.js` already has your Project URL + anon key (anon key is public by design; never use service_role).
2. Supabase -> SQL Editor: open `supabase_setup_all.sql`, set the 2 admin PASSWORDS in the last block
   (`CHANGE_ME_PASSWORD_1/2`, min 8 chars), Run once. Admin emails are already filled.
3. Supabase -> Authentication -> Providers -> Email ON; URL Configuration: Site URL + Redirect URL = your deployed site URL.
4. Upload ALL files in this folder with `index.html` at the site root (Vercel / Netlify / GitHub Pages).
   Do NOT open index.html by double-click (file://) — browsers block ES modules there; use a real URL or `npx serve`.

## Use
Login (PRN/email + password) -> students browse files. "Admin Login" -> "Upload Files" (admins only, any file type).
Telegram + WhatsApp ON, Instagram OFF (see `SOCIAL` in `portal.js`).
