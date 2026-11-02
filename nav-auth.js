import { supabase } from "./supabase.js";
const link = document.getElementById("authLink");
supabase.auth.getSession().then(({ data }) => {
  if (!data.session) return;
  link.textContent = "Logout";
  link.href = "#";
  link.onclick = async (e) => { e.preventDefault(); await supabase.auth.signOut(); location.reload(); };
});
