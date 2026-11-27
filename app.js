import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const $ = (id) => document.getElementById(id);
const CONFIG_KEY = "videopanel_config_v1";
let supabase = null;
let currentUser = null;

function show(id) {
  ["setup","login","dashboard","viewer"].forEach(x => $(x).classList.toggle("hidden", x !== id));
}
function config() {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || "null"); } catch { return null; }
}
function connect(c) {
  if (!c?.url || !c?.key) return false;
  supabase = createClient(c.url.replace(/\/$/,""), c.key);
  return true;
}
function slug() {
  return crypto.randomUUID().replaceAll("-","").slice(0,12);
}
function safeText(el, text) { el.textContent = text ?? ""; }

async function init() {
  const c = config();
  if (!c) { show("setup"); return; }
  if (!connect(c)) { show("setup"); return; }
  const hash = location.hash;
  const match = hash.match(/^#\/v\/([a-zA-Z0-9_-]+)$/);
  if (match) { await loadPublicVideo(match[1]); return; }
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user ?? null;
  if (currentUser) await openDashboard(); else show("login");
}
async function loadPublicVideo(id) {
  show("viewer");
  $("viewerTitle").textContent = "Memuat video…";
  const { data, error } = await supabase.from("videos").select("title,public_url").eq("slug",id).maybeSingle();
  if (error || !data) {
    $("viewerTitle").textContent = "Video tidak ditemukan";
    return;
  }
  $("viewerTitle").textContent = data.title || "Video";
  $("player").src = data.public_url;
}
async function openDashboard() {
  show("dashboard");
  safeText($("who"), currentUser?.email || "Admin");
  await loadVideos();
}
async function loadVideos() {
  const list = $("videoList");
  list.replaceChildren();
  const { data, error } = await supabase.from("videos").select("id,slug,title,public_url,storage_path,created_at").order("created_at",{ascending:false});
  if (error) { list.textContent = "Gagal memuat: " + error.message; return; }
  if (!data?.length) { list.innerHTML = '<div class="empty">Belum ada video. Upload video pertamamu.</div>'; return; }
  for (const v of data) {
    const item = document.createElement("article"); item.className = "item";
    const title = document.createElement("strong"); title.textContent = v.title || "Tanpa judul";
    const url = location.origin + location.pathname + "#/v/" + encodeURIComponent(v.slug);
    const link = document.createElement("div"); link.className="url"; link.textContent=url;
    const actions = document.createElement("div"); actions.className="actions";
    const copy = document.createElement("button"); copy.textContent="Salin link";
    copy.onclick = async () => { try { await navigator.clipboard.writeText(url); copy.textContent="Tersalin!"; } catch { prompt("Salin link ini:",url); } };
    const open = document.createElement("button"); open.className="secondary"; open.textContent="Lihat";
    open.onclick = () => window.open(url,"_blank","noopener");
    const del = document.createElement("button"); del.className="danger"; del.textContent="Hapus";
    del.onclick = async () => {
      if (!confirm("Hapus video ini? Link publik tidak akan berfungsi lagi.")) return;
      const { error: de } = await supabase.from("videos").delete().eq("id",v.id);
      if (de) alert(de.message); else { await supabase.storage.from("videos").remove([v.storage_path || ""]); await loadVideos(); }
    };
    actions.append(copy,open,del); item.append(title,link,actions); list.append(item);
  }
}
$("saveConfig").onclick = () => {
  const url=$("projectUrl").value.trim(), key=$("anonKey").value.trim();
  if (!/^https:\/\/.+\.supabase\.co\/?$/.test(url) || !key) { safeText($("setupStatus"),"Periksa Project URL dan anon/publishable key."); return; }
  localStorage.setItem(CONFIG_KEY,JSON.stringify({url,key}));
  location.hash=""; init();
};
$("editConfig").onclick = () => {
  const c=config(); $("projectUrl").value=c?.url||""; $("anonKey").value=c?.key||""; show("setup");
};
$("loginBtn").onclick = async () => {
  safeText($("loginStatus"),"Memeriksa akun…");
  const {data,error}=await supabase.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
  if(error){safeText($("loginStatus"),error.message);return;}
  currentUser=data.user; await openDashboard();
};
$("logout").onclick = async () => { await supabase.auth.signOut(); currentUser=null; show("login"); };
$("refresh").onclick = loadVideos;
$("uploadBtn").onclick = async () => {
  const file=$("videoFile").files[0], title=$("title").value.trim() || file?.name || "Video";
  if(!file){safeText($("uploadStatus"),"Pilih file video terlebih dahulu.");return;}
  if(!file.type.startsWith("video/")){safeText($("uploadStatus"),"File yang dipilih bukan video.");return;}
  $("uploadBtn").disabled=true; safeText($("uploadStatus"),"Mengunggah video… jangan tutup halaman.");
  try {
    const ext=(file.name.split(".").pop()||"mp4").toLowerCase().replace(/[^a-z0-9]/g,"") || "mp4";
    const path=`${currentUser.id}/${slug()}.${ext}`;
    const {error:upErr}=await supabase.storage.from("videos").upload(path,file,{contentType:file.type,upsert:false});
    if(upErr) throw upErr;
    const {data:pub}=supabase.storage.from("videos").getPublicUrl(path);
    const videoSlug=slug();
    const {error:dbErr}=await supabase.from("videos").insert({slug:videoSlug,title,public_url:pub.publicUrl,storage_path:path,owner_id:currentUser.id});
    if(dbErr){await supabase.storage.from("videos").remove([path]);throw dbErr;}
    safeText($("uploadStatus"),"Berhasil! Link: "+location.origin+location.pathname+"#/v/"+videoSlug);
    $("title").value=""; $("videoFile").value=""; await loadVideos();
  } catch(e) { safeText($("uploadStatus"),"Upload gagal: "+(e.message||"Periksa koneksi, kebijakan database, dan kuota storage.")); }
  finally {$("uploadBtn").disabled=false;}
};
window.addEventListener("hashchange",init);
init();
