import { supabase, BUCKET, CATALOG, isAdmin, toast } from "./supabase.js";
const $ = (id) => document.getElementById(id);
const MAX = 20 * 1024 * 1024;

function fill(id, items) {
  $(id).replaceChildren(...items.map((v) => new Option(v, v)));
}

async function loadList() {
  const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
  const ul = $("list");
  ul.replaceChildren();
  if (error) { toast(error.message); return; }
  if (!data.length) {
    const li = document.createElement("li"); li.className = "none"; li.textContent = "Abhi koi PDF upload nahi hui.";
    ul.append(li); return;
  }
  for (const r of data) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = r.file_url; a.target = "_blank"; a.rel = "noopener"; a.textContent = r.title;
    const meta = document.createElement("span");
    meta.textContent = `${r.university} · ${r.branch} · ${r.year} · ${r.type}`;
    const del = document.createElement("button");
    del.className = "danger-btn"; del.textContent = "Delete";
    del.onclick = () => removeItem(r, del);
    li.append(a, meta, del);
    ul.append(li);
  }
}

async function removeItem(r, btn) {
  if (!confirm(`"${r.title}" delete karna hai?`)) return;
  btn.disabled = true;
  const { error: e1 } = await supabase.storage.from(BUCKET).remove([r.file_path]);
  if (e1) { toast("File delete nahi hui: " + e1.message); btn.disabled = false; return; }
  const { error: e2 } = await supabase.from("resources").delete().eq("id", r.id);
  if (e2) { toast(e2.message); btn.disabled = false; return; }
  toast("Deleted ✓");
  loadList();
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = $("file").files[0];
  if (!file) return;
  if (file.type !== "application/pdf") { toast("Sirf PDF allowed hai"); return; }
  if (file.size > MAX) { toast("File 20 MB se badi hai"); return; }
  const btn = $("submit"); btn.disabled = true; btn.textContent = "Uploading…";

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${crypto.randomUUID()}-${safe}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: "application/pdf" });
  if (upErr) { toast("Upload fail: " + upErr.message); btn.disabled = false; btn.textContent = "Upload"; return; }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const { error } = await supabase.from("resources").insert({
    university: $("uni").value, branch: $("branch").value, year: $("year").value, type: $("type").value,
    title: $("title").value.trim(), file_path: path, file_url: pub.publicUrl,
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]); // orphan file hata do
    toast(error.message);
  } else {
    toast("Upload ho gaya ✓");
    $("form").reset();
    loadList();
  }
  btn.disabled = false; btn.textContent = "Upload";
});

$("logout").onclick = async () => { await supabase.auth.signOut(); location.replace("admin-login.html"); };

(async () => {
  if (!(await isAdmin())) { location.replace("admin-login.html"); return; }
  const { data: { session } } = await supabase.auth.getSession();
  $("who").textContent = session.user.email;
  $("logout").hidden = false;
  fill("uni", CATALOG.universities); fill("branch", CATALOG.branches);
  fill("year", CATALOG.years); fill("type", CATALOG.types);
  $("msg").hidden = true; $("panel").hidden = false;
  loadList();
})();
