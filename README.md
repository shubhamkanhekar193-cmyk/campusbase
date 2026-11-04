# CampusBase — fixed package (v3: university lock + Premium Silver/Gold)

## Deploy
1. `supabase.js` already has your Project URL + anon key (anon key is public by design; never use service_role).
2. Supabase -> SQL Editor:
   - FIRST install: open `supabase_setup_all.sql`, set the 2 admin PASSWORDS in the admin block (`CHANGE_ME_PASSWORD_1/2`, min 8 chars), Run once.
   - Already ran the earlier SQL? Just run `supabase_update_v3.sql` (adds university lock + premium).
3. Authentication -> Providers -> Email ON; URL Configuration: Site URL + Redirect URL = your deployed site URL.
4. Upload ALL files with `index.html` at the site root (Vercel / Netlify / GitHub Pages). Don't open via file://.

## Rules
- A logged-in student sees ONLY files of their own university (database-enforced). Login is required to view material.
- Students cannot change their university or plan; admin fixes it (SQL comment at the bottom of the update file).
- Premium: Silver / Gold. Admin uploads a file with Access = Free / Silver / Gold. Silver students see Free+Silver, Gold see all.
- Admin -> "Premium members": enter PRN/email, choose plan + duration -> Activate. Expired plans fall back to Free automatically.
- Plan names/prices/text: `PLANS` at the top of `portal.js`. No payment gateway: students message the admin on WhatsApp, admin activates.
- Profile photo: tap the photo on the home card or Profile -> camera icon.
