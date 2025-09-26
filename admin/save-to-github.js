/* Synergy Tao – inject "Save to GitHub" button for the directory admin
   Host this file, then include via:
   <script src="https://synergytao.github.io/synergytaohub-directory/admin/save-to-github.js"></script>
*/

/* ====== CONFIG – EDIT THESE ====== */
const SAVE_URL = "https://YOUR_VERCEL_PROJECT.vercel.app/api/save"; // e.g. https://sth-directory-proxy-<name>.vercel.app/api/save
const CLIENT_SHARED_KEY = "synergy-admin-2025";                      // must match Vercel env
const GH_OWNER  = "synergytao";
const GH_REPO   = "synergytaohub-directory";
const GH_PATH   = "data/directory.json";
const GH_BRANCH = "main";
/* ================================= */

/* helper: find the old "Copy Updated JSON" button by id or text */
function findLegacyCopyBtn() {
  let btn = document.getElementById("copyBtn");
  if (btn) return btn;
  const candidates = Array.from(document.querySelectorAll("button, a"));
  return candidates.find(el => /copy\s*updated\s*json/i.test((el.textContent||"").trim()));
}

/* save to GitHub via Vercel */
async function saveToGitHub() {
  try {
    if (!Array.isArray(window.rawData)) {
      alert("Nothing to save: data array (rawData) not found.");
      return;
    }
    const res = await fetch(SAVE_URL, {
      method: "POST",
      headers: {
        "X-API-Key": CLIENT_SHARED_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        json: window.rawData,
        message: `Admin update from directory page (${new Date().toISOString()})`,
        owner: GH_OWNER, repo: GH_REPO, path: GH_PATH, branch: GH_BRANCH
      })
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || ("HTTP " + res.status));
    alert("Saved to GitHub successfully.");
    // reload to pull the latest JSON (your page fetches from GitHub on load)
    location.reload();
  } catch (e) {
    console.error(e);
    alert("Save failed: " + (e.message || e));
  }
}

/* create & insert the new button; hide the old one if present */
function injectSaveButton() {
  const legacy = findLegacyCopyBtn();
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Save to GitHub";
  btn.style.cssText = `
    display:inline-block;margin-left:10px;padding:10px 14px;
    background:#2F6E4E;color:#fff;border:2px solid #2F6E4E;
    border-radius:10px;font-weight:700;cursor:pointer
  `;
  btn.addEventListener("click", saveToGitHub);

  if (legacy && legacy.parentNode) {
    legacy.style.display = "none";
    legacy.parentNode.insertBefore(btn, legacy.nextSibling);
  } else {
    // fallback floating button
    btn.style.position = "fixed";
    btn.style.right = "16px";
    btn.style.bottom = "16px";
    btn.style.boxShadow = "0 6px 20px rgba(0,0,0,.15)";
    btn.style.zIndex = "9999";
    document.body.appendChild(btn);
  }
}

/* run after DOM is ready; also observe dynamic UI changes */
function ready(fn){ document.readyState!=="loading" ? fn() : document.addEventListener("DOMContentLoaded", fn); }
ready(() => {
  injectSaveButton();
  const mo = new MutationObserver(() => injectSaveButton());
  mo.observe(document.body, { childList:true, subtree:true });
});
