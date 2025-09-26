/* Save to GitHub button (admin-only via ?admin=1) */
const SAVE_URL  = "https://sth-directory-proxy-qu11uy5na-synergytaos-projects.vercel.app/api/save";
const API_KEY   = "ST_Admin_Pass"; // must equal Vercel env CLIENT_SHARED_KEY

const GH_OWNER  = "synergytao";
const GH_REPO   = "synergytaohub-directory";
const GH_PATH   = "data/directory.json";
const GH_BRANCH = "main";

function isAdmin() {
  return location.search.includes("admin=1")
      || document.body.classList.contains("is-admin")
      || localStorage.getItem("sth_admin")==="1";
}

async function fetchCommitted() {
  const url = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${GH_PATH}?t=${Date.now()}`;
  const r = await fetch(url);
  return r.json();
}

async function onSaveClick() {
  try {
    let data = null;
    try {
      if (typeof window.getDirectoryData === "function") data = window.getDirectoryData();
      if (!Array.isArray(data) && Array.isArray(window.rawData)) data = window.rawData;
    } catch {}

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
    console.error(e);
    alert("Save failed: " + (e.message || e));
  }
}

function injectSaveBtn() {
  if (!isAdmin()) return;                        // hide for public
  if (document.getElementById("sth-save-to-github")) return;

  try { document.body.style.paddingBottom = "90px"; } catch {}

  const b = document.createElement("button");
  b.id = "sth-save-to-github";
  b.type = "button";
  b.textContent = "Save to GitHub";
  b.style.cssText = "position:fixed;right:24px;bottom:24px;z-index:9999;padding:10px 14px;background:#2F6E4E;color:#fff;border:2px solid #2F6E4E;border-radius:12px;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,.15);cursor:pointer";
  b.addEventListener("click", onSaveClick);
  document.body.appendChild(b);
}

function syncWindowRawData() {
  try {
    if (typeof rawData !== "undefined") {
      window.rawData = rawData;
      setInterval(() => { try { window.rawData = rawData; } catch{} }, 500);
    }
  } catch {}
}

(function start(){
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { injectSaveBtn(); syncWindowRawData(); });
  } else {
    injectSaveBtn(); syncWindowRawData();
  }
})();
