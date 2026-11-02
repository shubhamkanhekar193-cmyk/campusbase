import { supabase } from "./supabase.js";

const $ = (id) => document.getElementById(id);
let mode = "login";

function setMode(m) {
  mode = m;
  const reg = m === "register";
  $("tabLogin").setAttribute("aria-selected", String(!reg));
  $("tabReg").setAttribute("aria-selected", String(reg));
  $("nameRow").hidden = !reg;
  $("pass2Row").hidden = !reg;
  $("title").textContent = reg ? "Create your account" : "Welcome back";
  $("submit").textContent = reg ? "Register" : "Login";
  $("password").autocomplete = reg ? "new-password" : "current-password";
  $("msg").textContent = "";
}
$("tabLogin").onclick = () => setMode("login");
$("tabReg").onclick = () => setMode("register");

// Pehle se login hai to home pe bhejo
supabase.auth.getSession().then(({ data }) => { if (data.session) location.replace("index.html"); });

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("msg"); msg.className = "form-msg";
  const email = $("email").value.trim();
  const password = $("password").value;
  if (!email || password.length < 6) { msg.textContent = "Valid email aur kam se kam 6 character ka password daalo."; return; }
  $("submit").disabled = true;

  if (mode === "register") {
    if (password !== $("password2").value) { msg.textContent = "Dono password match nahi ho rahe."; $("submit").disabled = false; return; }
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: $("name").value.trim() }, emailRedirectTo: location.origin + location.pathname.replace("auth.html", "index.html") },
    });
    if (error) msg.textContent = error.message;
    else if (data.session) location.replace("index.html");
    else { msg.className = "form-msg ok"; msg.textContent = "Account ban gaya! Email me confirmation link aaya hai — use click karke phir Login karo."; }
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) msg.textContent = error.message.includes("Email not confirmed") ? "Pehle email confirm karo (inbox/spam check karo)." : "Email ya password galat hai.";
    else location.replace("index.html");
  }
  $("submit").disabled = false;
});
