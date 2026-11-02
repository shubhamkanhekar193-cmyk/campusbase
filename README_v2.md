# CampusBase v2 add-on (purane files badlele nahit)

Navin files: `portal.html`, `portal.js`, `portal.css`, `setup_v2.sql`, `README_v2.md`
Baki sagle files (index.html, auth*, admin*, supabase.js, setup.sql, style.css...) jase hote tase ahet.

## Setup
1. Pahile `setup.sql` run kara (jar adhi kela nasel), mag `setup_v2.sql` run kara.
2. `setup.sql` madhe `admin1@gmail.com` / `admin2@gmail.com` apalya 2 admin emails ne badla.
3. `supabase.js` madhe URL + anon key (adhich bharli asel tar kahi nahi).
4. Authentication -> Email provider ON. Redirect URL madhe `portal.html` cha URL jodaa.
5. `portal.html` ughda.

## Vapar
- Student: Register (PRN, name, email, university, branch, year, password). Login: PRN kiva email + password.
- Admin: `setup.sql` madhe 2 admin emails taka (sirf 2 admin). Tya emails var normal Register kara, mag Login page var "Admin Login" -> login. Admin la "Upload Files" disto (kontyahi file type upload/delete). Students la nahi, ani database (RLS) pan block karto.
- Social links (Instagram/WhatsApp/Telegram) OFF. `portal.js` chya var `SOCIAL` madhe `on:true` + `url`.
- Premium: add kele nahi.
