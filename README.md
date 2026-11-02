# CampusBase — Login / Register + 2 Admins

## Files
- `auth.html` + `auth.js` — student Login / Register
- `admin-login.html` + `admin-login.js` — admin login
- `admin.html` + `admin.js` — PDF upload / delete (sirf admins)
- `supabase.js` — URL + anon key + dropdown lists
- `setup.sql` — tables, security, 2-admin limit
- `nav-auth.js` — home page par Login/Logout link

## Setup
1. `setup.sql` me dono admin emails badlo → Supabase SQL Editor me Run.
2. `supabase.js` me Project URL + anon key daalo.
3. Authentication → Providers → **Email** ON (Confirm email ON rakho).
4. Authentication → URL Configuration → Redirect URLs me `index.html` aur `admin-login.html` ka URL jodo.
5. Dono admins pehle `auth.html` se **Register** karein (same email jo SQL me hai), email confirm karein.
6. `admin-login.html` se login → PDFs upload / delete.
