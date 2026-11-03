# CampusBase v2
Open `index.html` (ya kisi bhi static hosting - Vercel/GitHub Pages - var upload kara).

- Login / Register: PRN number + password
- Left ☰ menu: sagle options (Premium nahi - nantar)
- Profile: 👤 icon kiva bottom nav "Profile"
- Telegram: ON (t.me/campusbase_study_material). WhatsApp: ON. Instagram: OFF. Chalu karayla `index.html` madhe top la `SOCIAL` config madhe `on:true` ani `url` taka.
- Admin: login page var "Admin Login". Demo admins: admin1@campusbase.app / admin2@campusbase.app, password admin123 (sirf 2 admin). Admin login nantar "Upload Files" disto (kontyahi file type upload/delete). Normal users la nahi.
- Demo mode: data browser madhe save hoto. Real database sathi Supabase (purvicha CampusBase.zip madhla setup.sql) jodava lagel.

## Deploy (Vercel / Netlify / GitHub Pages)
Upload so that `index.html` is in the ROOT of the site. The page is one self-contained file (no external CSS/JS),
so theme, background and the animated neon login look the same everywhere. Theme: dark teal by default (☀️/🌙 toggle is remembered).
