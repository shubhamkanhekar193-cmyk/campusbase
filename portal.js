// CampusBase v2 portal — uses the SAME Supabase backend/files as the rest of the project (supabase.js, setup.sql).
import { supabase, BUCKET, CATALOG, isAdmin } from "./supabase.js";

// Social links are OFF for now. Set on:true and a url to enable later.
const SOCIAL={instagram:{on:false,url:""},whatsapp:{on:true,url:"https://chat.whatsapp.com/ICt2INQ4g2JEKB8urgboBd"},telegram:{on:true,url:"https://t.me/campusbase_study_material"}};
const C={unis:["SPPU","BATU","SGBBU","AKTU"],branches:[...new Set(["AI & ML",...CATALOG.branches])],years:CATALOG.years,
  types:[...new Set(["Notes","Handwritten Notes","Question Bank","Answer Bank","Formula Notes","Previous Year Papers","Books",...CATALOG.types])]};
const YL={FE:"First Year",SE:"Second Year",TE:"Third Year",BE:"Final Year"};
const $=id=>document.getElementById(id);
const toast=t=>{const e=$("toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2600)};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const opts=(a,v,lab)=>a.map(x=>`<option value="${esc(x)}"${x===v?" selected":""}>${esc(lab?lab[x]:x)}</option>`).join("");
const fill=(id,a,lab)=>{$(id).innerHTML=opts(a,null,lab)};
const mk=(t,x,c)=>{const e=document.createElement(t);if(x!=null)e.textContent=x;if(c)e.className=c;return e};
const soon=()=>toast("Coming soon 🚀");
const social=k=>{const s=SOCIAL[k];s.on&&s.url?open(s.url,"_blank","noopener"):soon()};

// ---- session state ----
const S={user:null,prof:null,admin:false};
async function load(){const{data:{session}}=await supabase.auth.getSession();S.user=session?session.user:null;S.prof=null;S.admin=false;
  if(S.user){const[p,a]=await Promise.all([supabase.from("profiles").select("*").eq("id",S.user.id).maybeSingle(),isAdmin()]);S.prof=p.data;S.admin=a}}
const me=()=>{if(!S.user)return null;const p=S.prof||{};return{name:p.name||S.user.user_metadata?.full_name||S.user.email.split("@")[0],email:S.user.email,prn:p.prn||"—",uni:p.university||C.unis[0],branch:p.branch||C.branches[0],year:p.year||"FE",photo:p.photo,admin:S.admin}};
const sid=u=>"@"+u.name.toLowerCase().trim().replace(/\s+/g,".");
const avatar=u=>`<span class="av">${u&&u.photo?`<img src="${esc(u.photo)}" alt="">`:esc(u?u.name[0].toUpperCase():"👤")}</span>`;
async function logout(){await supabase.auth.signOut();await load();toast("Logged out");location.hash="home";route()}

// theme
const setTheme=d=>{document.documentElement.dataset.theme=d?"dark":"light";$("themeBtn").textContent=d?"🌙":"☀️"};
setTheme(matchMedia("(prefers-color-scheme: dark)").matches);$("themeBtn").onclick=()=>setTheme(document.documentElement.dataset.theme!=="dark");

// drawer
const T=t=>"type:"+t;
const MENU=[["👥","Social Mode","soon"],["🏠","Home","home"],["📗","Notes",T("Notes")],["✍️","Handwritten Notes",T("Handwritten Notes")],["🗄️","Question Bank",T("Question Bank")],["⭐","Answer Bank",T("Answer Bank")],["☑️","MCQ","soon"],["🏆","Leaderboard","soon"],["💬","Doubt Solving","soon"],["√x","Formula Notes",T("Formula Notes")],["📄","Previous Year Papers",T("Previous Year Papers")],["📕","Books",T("Books")],["⬇️","Downloads","soon"],["🎖️","Certificates","soon"],["📝","Revaluation Score","soon"],["🎁","Refer & Earn","soon"],["📱","Download App","soon"],["🧾","Payment Receipt","soon"],["ℹ️","About Us","foot"],["📸","Follow on Instagram","s:instagram"],["💚","Join WhatsApp Group","s:whatsapp"],["✈️","Join Telegram","s:telegram"],["✉️","Contact Us","foot"],["⚙️","Settings","soon"]];
function drawer(){const u=me();
  $("dUser").innerHTML=avatar(u)+`<div><b>${esc(u?u.name:"Guest")}</b><div class="muted">${esc(u?u.branch:"Please login")}</div></div>`;
  const l=$("dList");l.innerHTML="";
  (u&&u.admin?[["📤","Upload Files","admin"],...MENU]:MENU).forEach(([i,t,a])=>{const li=document.createElement("li"),b=mk("button",null,(a==="soon"||(a.startsWith("s:")&&!SOCIAL[a.slice(2)].on))?"off":"");b.innerHTML=`<span style="width:22px;text-align:center">${i}</span>${esc(t)}`;b.onclick=()=>{go(a);setDrawer(false)};li.append(b);l.append(li)});
  const li=document.createElement("li"),b=mk("button",u?"⎋  Logout":"⎋  Login / Register","lo");b.onclick=()=>{setDrawer(false);u?logout():(location.hash="login")};li.append(b);l.append(li)}
const setDrawer=o=>{$("drawer").classList.toggle("on",o);$("scrim").classList.toggle("on",o)};
$("burger").onclick=()=>{drawer();setDrawer(true)};$("scrim").onclick=()=>setDrawer(false);
function go(a){if(a==="soon")return soon();if(a==="home"){location.hash="home";scrollTo(0,0)}else if(a==="admin")location.hash="admin";else if(a==="foot")$("foot").scrollIntoView({behavior:"smooth"});
  else if(a.startsWith("s:"))social(a.slice(2));else if(a.startsWith("type:"))browse(a.slice(5))}

// routing
function route(){const h=location.hash.slice(1)||"home",u=me();let v="home";
  if(h==="login"||h==="master"){if(u){location.hash=u.admin?"admin":"home";return}v="auth";setMode(h==="master"?"master":(mode==="register"?"register":"login"))}
  else if(h==="admin"){if(u&&u.admin)v="admin";else{location.hash="master";return}}
  document.querySelectorAll(".view").forEach(s=>s.hidden=s.id!=="v-"+v);$("backBtn").hidden=v==="home";
  if(v==="home")home();if(v==="admin"){$("who").textContent="Signed in as admin: "+u.email;list()}
  document.querySelectorAll(".bnav button").forEach(b=>b.classList.toggle("on",b.dataset.n==="home"&&v==="home"))}
$("backBtn").onclick=()=>history.length>1?history.back():(location.hash="home");
addEventListener("hashchange",()=>{route();scrollTo(0,0)});

// home
const CARDS=[["🗄️","Question Bank","5000+ Questions","Question Bank","Explore"],["⭐","Answer Bank","Solved Answers","Answer Bank","Explore"],["📗","Notes","All Subject Notes","Notes","Explore"],["✍️","Handwritten Notes","Topper Handwritten Notes","Handwritten Notes","Explore"],["☑️","MCQ","Practice MCQ",0,"Explore"],["🏆","Leaderboard","Quiz Rankings",0,"View"],["💬","Doubt Solving","Get your doubts solved",0,"Ask Now"],["√x","Formula Notes","All Formulas in one place","Formula Notes","Explore"],["🎖️","Certificates","Your Achievements",0,"View All"]];
const MORE=[["📄","Previous Year Papers","Download previous year question papers","Previous Year Papers","Explore"],["📚","Study Materials","Important books & study materials","Books","Explore"]];
function card(c){const d=mk("div",null,"card dc");d.innerHTML=`<span class="ic">${c[0]}</span><b>${esc(c[1])}</b><span class="muted">${esc(c[2])}</span>`;
  const b=mk("button",c[4],"uni-btn");b.onclick=()=>c[3]==="@admin"?(location.hash="admin"):c[3]?browse(c[3]):soon();d.append(b);return d}
function home(){const u=me();
  $("greet").innerHTML=u?`${avatar(u)}<div><b>Hello, ${esc(u.name)}! 👋</b><div class="muted">Keep learning, keep growing.</div>${u.admin?'<span class="chip">Admin</span>':`<span class="chip">${esc(YL[u.year]||"")} Student</span>`}</div><div class="sp muted" style="text-align:right">Your Progress<br>Coming soon</div>`
    :`<span class="av">👋</span><div><b>Hello, Student!</b><div class="muted">Login with your PRN to personalise.</div></div><a class="uni-btn sp" href="#login">Login</a>`;
  $("branchCard").innerHTML=u&&!u.admin?`<span class="av" style="border-radius:12px">🤖</span><div><b>${esc(u.branch)}</b><div class="muted">${esc(u.uni)} · ${esc(YL[u.year])}</div></div><span class="chip sp">Open</span>`:`<div class="muted">${u?"Admin account":"Login to see your branch."}</div>`;
  $("soc").innerHTML="";[["ig","📸 Instagram","instagram"],["wa","💬 WhatsApp","whatsapp"],["tg","✈️ Telegram","telegram"]].forEach(([c,t,k])=>{const b=mk("button",t,c+(SOCIAL[k].on?"":" off"));b.onclick=()=>social(k);$("soc").append(b)});
  $("dash").replaceChildren(...(u&&u.admin?[["📤","Upload Files","Add or delete material","@admin","Open"]]:[]).concat(CARDS).map(card));$("more").replaceChildren(...MORE.map(card));
  const cb=$("commBtn");cb.className=SOCIAL.whatsapp.on?"":"off";cb.onclick=()=>social("whatsapp");$("apkBtn").onclick=soon}
$("sidBtn").onclick=async()=>{if(!S.user){toast("Login to search students");return}const q=$("sidIn").value.trim().replace(/^@?/,"@");
  const{data}=await supabase.rpc("find_student",{p_sid:q});const r=data&&data[0];$("sidRes").textContent=r?`✓ ${r.name} · ${r.branch} · ${YL[r.year]||r.year} · ${r.university}`:"No student found with this SID."};
document.querySelectorAll("[data-soon]").forEach(a=>a.onclick=soon);document.querySelectorAll("[data-soc]").forEach(a=>a.onclick=()=>social(a.dataset.soc));
document.querySelectorAll(".bnav button").forEach(b=>b.onclick=()=>{const n=b.dataset.n;if(n==="home"){location.hash="home";scrollTo(0,0)}else if(n==="explore"){location.hash="home";setTimeout(()=>$("dash").scrollIntoView({behavior:"smooth"}),50)}else if(n==="prof")profile();else soon()});

// browse files
let tab=C.types[0];fill("fUni",C.unis);fill("fBranch",C.branches);fill("fYear",C.years,YL);
function browse(t){const u=me();tab=t;if(u&&!u.admin){$("fUni").value=u.uni;$("fBranch").value=u.branch;$("fYear").value=u.year}if(!$("modal").open)$("modal").showModal();show()}
async function show(){const t=$("tabs");t.replaceChildren();C.types.forEach(x=>{const b=mk("button",x);b.setAttribute("aria-selected",x===tab);b.onclick=()=>{tab=x;show()};t.append(b)});
  const l=$("resList");l.replaceChildren(mk("li","Loading…","none"));
  const{data,error}=await supabase.from("resources").select("*").eq("university",$("fUni").value).eq("branch",$("fBranch").value).eq("year",$("fYear").value).eq("type",tab).order("created_at",{ascending:false});
  l.replaceChildren();if(error)return l.append(mk("li",error.message,"none"));
  if(!data.length)return l.append(mk("li","Nothing uploaded here yet.","none"));
  data.forEach(x=>{const li=document.createElement("li"),a=mk("a",x.title);a.href=x.file_url;a.target="_blank";a.rel="noopener";li.append(a);l.append(li)})}
["fUni","fBranch","fYear"].forEach(i=>$(i).onchange=show);$("mClose").onclick=()=>$("modal").close();

// profile sheet
async function saveProf(patch){const{error}=await supabase.from("profiles").update(patch).eq("id",S.user.id);if(error)return toast(error.message),false;await load();home();return true}
function profile(mode){const u=me();if(!u){toast("Please login first");location.hash="login";return}
  const s=$("sheet"),b=$("sheetBody");
  if(mode==="edit"||mode==="branch"){const br=mode==="branch";
    b.innerHTML=`<form id="pf" class="f"><h3>${br?"Change Branch":"Edit Profile"}</h3>`+(br?`<label>Branch<select id="pBranch">${opts(C.branches,u.branch)}</select></label>`:
      `<label>Full name<input id="pName" class="search" maxlength="60" value="${esc(u.name)}"></label><label>University<select id="pUni">${opts(C.unis,u.uni)}</select></label><label>Year<select id="pYear">${opts(C.years,u.year,YL)}</select></label>`)+
      `<button class="primary-btn wide">Save</button><button type="button" class="primary-btn wide ghost" id="pBack">Cancel</button></form>`;
    $("pBack").onclick=()=>profile();
    $("pf").onsubmit=async e=>{e.preventDefault();let p;if(br)p={branch:$("pBranch").value};else{const n=$("pName").value.trim();if(!n)return toast("Name required");p={name:n,university:$("pUni").value,year:$("pYear").value}}
      if(await saveProf(p)){toast("Saved ✓");profile()}}}
  else{b.innerHTML=`<div style="text-align:center"><div class="pav">${avatar(u)}<label title="Change photo">📷<input type="file" id="pPhoto" accept="image/*" hidden></label></div><p class="muted">Tap the camera icon to update your photo.</p>
    <h2>${esc(u.name)}</h2><p class="muted">${esc(u.email)}</p>${u.admin?'<p class="mt"><span class="chip">ADMIN</span></p>':`<p class="mt"><span class="chip">${esc((YL[u.year]||"").toUpperCase())}</span> <span class="chip">${esc(u.branch.toUpperCase())}</span></p>`}</div>
    <div class="pg"><div><small>Public S ID</small><b>${esc(sid(u))}</b></div><div><small>PRN</small><b>${esc(u.prn)}</b></div><div><small>Year</small><b>${esc(YL[u.year])}</b></div><div><small>Branch</small><b>${esc(u.branch)}</b></div><div><small>University</small><b>${esc(u.uni)}</b></div><div><small>Academic Year</small><b>2025–26</b></div></div>
    <button class="primary-btn wide" id="pEdit">✎ Edit Profile</button><button class="primary-btn wide" id="pBr">⇄ Change Branch</button><button class="primary-btn wide ghost" id="pClose">Close</button>`;
    $("pEdit").onclick=()=>profile("edit");$("pBr").onclick=()=>profile("branch");$("pClose").onclick=()=>s.close();
    $("pPhoto").onchange=e=>{const f=e.target.files[0];if(!f)return;const img=new Image();img.onload=async()=>{const c=document.createElement("canvas");c.width=c.height=160;const m=Math.min(img.width,img.height);c.getContext("2d").drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,160,160);if(await saveProf({photo:c.toDataURL("image/jpeg",.8)}))profile()};img.src=URL.createObjectURL(f)}}
  if(!s.open)s.showModal()}
$("profBtn").onclick=()=>profile();$("sheet").addEventListener("click",e=>{if(e.target.id==="sheet")e.target.close()});

// auth
let mode="login";fill("aUni",C.unis);fill("aBranch",C.branches);fill("aYear",C.years,YL);
const MODES={login:["Welcome Back","Login via Email or PRN Number","Email Address or PRN Number","Login","Don't have an account?","Sign up","register"],
 register:["Create Account","Register with your PRN Number","PRN Number","Register","Already registered?","Login","login"],
 master:["Admin Login","Admins only — upload & manage files","Admin Email","Login as Admin","Not an admin?","Student login","login"]};
function setMode(m){mode=m;const d=MODES[m],adm=m==="master";
  $("aTitle").textContent=d[0];$("aSub").textContent=d[1];$("idLbl").textContent=d[2];$("aSubmit").textContent=d[3];$("swapTxt").textContent=d[4];$("swap").textContent=d[5];
  $("regRows").hidden=m!=="register";$("toReg").textContent=m==="register"?"Login":"Sign Up";$("toReg").hidden=adm;
  $("mLbl").textContent=adm?"Student Login":"Admin Login";$("forgot").hidden=false;$("aId").type=adm?"email":"text";$("aMsg").textContent="";$("aMsg").style.color="";
  $("aPass").autocomplete=m==="register"?"new-password":"current-password"}
$("swap").onclick=()=>mode==="master"?(location.hash="login"):setMode(MODES[mode][6]);$("toReg").onclick=()=>setMode(mode==="register"?"login":"register");
$("masterLink").onclick=()=>{location.hash=mode==="master"?"login":"master"};
$("forgot").onclick=async()=>{const id=$("aId").value.trim();if(!id.includes("@"))return toast("Enter your email above, then tap Forgot password");
  const{error}=await supabase.auth.resetPasswordForEmail(id,{redirectTo:location.href.split("#")[0]});toast(error?error.message:"Password reset link sent to your email")};
$("joinBtn").onclick=()=>social("whatsapp");
const ok=(m,t)=>{m.style.color="#16a34a";m.textContent=t};
$("authForm").onsubmit=async e=>{e.preventDefault();const m=$("aMsg"),btn=$("aSubmit"),id=$("aId").value.trim(),pw=$("aPass").value;m.textContent="";m.style.color="";
  if(pw.length<6)return m.textContent="Password must be at least 6 characters.";
  btn.disabled=true;try{await doAuth(id,pw,m,e.target)}catch(x){m.textContent="Something went wrong: "+x.message}finally{btn.disabled=false}};
async function doAuth(id,pw,m,form){const em=id.toLowerCase();
  if(mode==="login"){let mail=em;
    if(!id.includes("@")){const{data}=await supabase.rpc("login_email",{p:id.toUpperCase()});if(!data)return m.textContent="PRN not found. Please register first.";mail=data}
    const{error}=await supabase.auth.signInWithPassword({email:mail,password:pw});
    if(error)return m.textContent=/confirm/i.test(error.message)?"Please confirm your email first (check inbox/spam).":"Wrong PRN/email or password.";
    await load();form.reset();location.hash=S.admin?"admin":"home";route()}
  else if(mode==="register"){const prn=id.toUpperCase(),n=$("aName").value.trim(),mail=$("aEmail").value.trim().toLowerCase();
    if(!/^[A-Z0-9]{5,20}$/.test(prn))return m.textContent="Enter a valid PRN (5–20 letters/digits).";
    if(!n||!/^\S+@\S+\.\S+$/.test(mail))return m.textContent="Enter your name and a valid email.";
    const{data:ex}=await supabase.rpc("login_email",{p:prn});if(ex)return m.textContent="This PRN is already registered.";
    const{data,error}=await supabase.auth.signUp({email:mail,password:pw,options:{data:{prn,name:n,university:$("aUni").value,branch:$("aBranch").value,year:$("aYear").value},emailRedirectTo:location.href.split("#")[0]}});
    if(error)return m.textContent=/registered|already/i.test(error.message)?"This email is already registered.":"Registration failed: "+error.message;
    form.reset();if(data.session){await load();location.hash="home";route()}else{setMode("login");ok(m,"Account created! Click the confirmation link in your email, then login.")}}
  else if(mode==="master"){const{error}=await supabase.auth.signInWithPassword({email:em,password:pw});if(error)return m.textContent="Wrong admin email or password.";
    await load();if(!S.admin){await supabase.auth.signOut();await load();return m.textContent="This account is not an admin."}
    form.reset();location.hash="admin";route()}
}
$("adOut").onclick=logout;

// admin: upload (any file) / delete
fill("uUni",C.unis);fill("uBranch",C.branches);fill("uYear",C.years,YL);fill("uType",C.types);
async function list(){const l=$("upList");l.replaceChildren(mk("li","Loading…","none"));
  const{data,error}=await supabase.from("resources").select("*").order("created_at",{ascending:false});l.replaceChildren();
  if(error)return l.append(mk("li",error.message,"none"));if(!data.length)return l.append(mk("li","No files uploaded yet.","none"));
  data.forEach(x=>{const li=document.createElement("li"),a=mk("a",x.title);a.href=x.file_url;a.target="_blank";a.rel="noopener";const b=mk("button","Delete","danger-btn");
    b.onclick=async()=>{if(!confirm(`Delete "${x.title}"?`))return;b.disabled=true;const{error:e1}=await supabase.storage.from(BUCKET).remove([x.file_path]);if(e1){b.disabled=false;return toast("File delete failed: "+e1.message)}
      const{error:e2}=await supabase.from("resources").delete().eq("id",x.id);if(e2){b.disabled=false;return toast(e2.message)}toast("Deleted ✓");list()};
    li.append(a,mk("span",`${x.university} · ${x.branch} · ${x.year} · ${x.type}`),b);l.append(li)})}
$("upForm").onsubmit=async e=>{e.preventDefault();if(!S.admin)return toast("Admins only");const f=$("uFile").files[0];if(!f)return;if(f.size>20*1024*1024)return toast("File is larger than 20 MB");
  const btn=e.target.querySelector("button");btn.disabled=true;btn.textContent="Uploading…";
  const path=`${crypto.randomUUID()}-${f.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
  const{error:ue}=await supabase.storage.from(BUCKET).upload(path,f,{contentType:f.type||"application/octet-stream"});
  if(ue){btn.disabled=false;btn.textContent="Upload";return toast("Upload failed: "+ue.message)}
  const{data:pub}=supabase.storage.from(BUCKET).getPublicUrl(path);
  const{error}=await supabase.from("resources").insert({university:$("uUni").value,branch:$("uBranch").value,year:$("uYear").value,type:$("uType").value,title:$("uTitle").value.trim(),file_path:path,file_url:pub.publicUrl});
  if(error){await supabase.storage.from(BUCKET).remove([path]);toast(error.message)}else{toast("File uploaded ✓");e.target.reset();list()}
  btn.disabled=false;btn.textContent="Upload"};

supabase.auth.onAuthStateChange(ev=>{if(ev==="SIGNED_OUT"||ev==="PASSWORD_RECOVERY")setTimeout(async()=>{await load();route()},0)});
load().then(route);
