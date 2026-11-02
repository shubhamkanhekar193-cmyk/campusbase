import { supabase, isAdmin } from "./supabase.js";
const $ = (id) => document.getElementById(id);

// Already admin login hai to seedha panel
isAdmin().then((ok) => { if (ok) location.replace("admin.html"); });

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("msg"); msg.textContent = "";
  $("submit").disabled = true;
  const { error } = await supabase.auth.signInWithPassword({ email: $("email").value.trim(), password: $("password").value });
  if (error) {
    msg.textContent = error.message.includes("Email not confirmed") ? "Pehle email confirm karo." : "Email ya password galat hai.";
  } else if (await isAdmin()) {
    location.replace("admin.html");
    return;
  } else {
    await supabase.auth.signOut();
    msg.textContent = "Ye account admin nahi hai.";
  }
  $("submit").disabled = false;
});
