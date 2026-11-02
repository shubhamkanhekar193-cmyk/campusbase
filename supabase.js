import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// 👉 Supabase → Project Settings → API se yahan paste karo (service_role kabhi nahi)
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const BUCKET = "pdfs";

// ⚠️ Ye lists script.js wali lists jaisi hi rakho
export const CATALOG = {
  universities: ["SPPU (Pune)", "DBATU", "Mumbai University", "Shivaji University"],
  branches: ["Computer", "IT", "Mechanical", "Civil", "Electrical", "E&TC", "Chemical", "AI & DS"],
  years: ["FE", "SE", "TE", "BE"],
  types: ["Syllabus", "Notes", "Question Papers", "Important Questions"],
};

export async function isAdmin() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const { data } = await supabase.from("admins").select("email").limit(1);
  return !!(data && data.length);
}

export function toast(text) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = text;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}
