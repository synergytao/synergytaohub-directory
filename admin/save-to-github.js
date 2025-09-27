/* admin/save-to-github.js — stable API; reads passkey from page (window.ADMIN_KEY) */
const SAVE_URL  = (window.__SAVE_URL || "https://sth-directory-proxy.vercel.app/api/save");
const API_KEY   = (window.ADMIN_KEY   || "synergy-admin-2025"); // must match Vercel env CLIENT_SHARED_KEY

const GH_OWNER  = "synergytao";
const GH_REPO   = "synergytaohub-directory";
const GH_PATH   = "data/directory.json";
const GH_BRANCH = "main";

function isAdmin() {
  return document.body.classList.contains("is-admin") || localStorage.getItem("sth_admin")==="1";
}

async function fetchCommitted() {
  const url = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${GH_PATH}?t=${Date.now()}`;
  const r = await fetch(url);
  return r.json();
}

async function onSaveClick() {
  try {
    let data = null;
    if (Array.isArray(window.rawData)) data = window.rawData;
    if (!Array.isArray(data)) data = await fetchCommitted();
    if (!Array.isArray(data)) return alert("Could not read directory data.");

    const res = await fetch(SAVE_URL, {
      method: "POST",
      headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        json: data,
        message: `Admin update (${new Date().toISOString()})`,
        owner: GH_OWNER, repo: GH_REPO, path: GH_PATH, branch: GH_BRANCH
      })
    });

    const text = await res.text();
    if (!res.ok) throw new Error(text || ("HTTP " + res.status));
    alert("Saved to GitHub successfully.");
    location.reload();
  } catch (e) {
    console.error("Save failed:", e);
    alert("Save failed: " + (e.message || e));
  }
}

function addButtons() {
  if (!isAdmin()) return;
  if (document.getElementById("sth-save-to-github")) return;

  try { document.body.style.paddingBottom = "90px"; } catch {}

  const btn = document.createElement("button");
  btn.id = "sth-save-to-github";
  btn.textContent = "Save to GitHub";
  btn.style.cssText = "position:fixed;right:24px;bottom:24px;z-index:9999;padding:10px 14px;background:#2F6E4E;color:#fff;border:2px solid #2F6E4E;border-radius:12px;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,.15);cursor:pointer";
  btn.addEventListener("click", onSaveClick);
  document.body.appendChild(btn);
}

(function start(){
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addButtons);
  } else {
    addButtons();
  }
})();
