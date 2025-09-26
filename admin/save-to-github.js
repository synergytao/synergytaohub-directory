/* Synergy Tao – Save-to-GitHub injector (Admin-only)
   Host at:
   https://synergytao.github.io/synergytaohub-directory/admin/save-to-github.js
*/

/* ====== CONFIG – EDIT THESE ====== */
const DATA_URL  = "https://raw.githubusercontent.com/synergytao/synergytaohub-directory/main/data/directory.json";
const SAVE_URL  = "https://sth-directory-proxy.vercel.app/api/save"; // e.g. https://sth-directory-proxy-<name>.vercel.app/api/save
const API_KEY   = "synergy-admin-2025"; // must match Vercel CLIENT_SHARED_KEY
const GH_OWNER  = "synergytao";
const GH_REPO   = "synergytaohub-directory";
const GH_PATH   = "data/directory.json";
const GH_BRANCH = "main";
/* ================================= */

/* helpers */
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>Array.from(document.querySelectorAll(s));

function inAdminMode() {
  return document.body.classList.contains("is-admin") || ($("#adminBar") && getComputedStyle($("#adminBar")).display !== "none");
}

function findLegacyCopyBtn() {
  let btn = document.getElementById("copyBtn");
  if (btn) return btn;
  const candidates = $$("button, a");
  return candidates.find(el => /copy\s*updated\s*json/i.test((el.textContent||"").trim()));
}

async function fetchCurrentFromGit() {
  const res = await fetch(DATA_URL + "?t=" + Date.now());
  return await res.json();
}

/* build the button */
function makeSaveBtn() {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = "Save to GitHub";
  b.style.cssText = `
    display:inline-block;margin-left:10px;padding:10px 14px;
    background:#2F6E4E;color:#fff;border:2px solid #2F6E4E;
    border-radius:10px;font-weight:700;cursor:pointer
  `;
  b.addEventListener("click", onSaveClick);
  return b;
}

/* click handler */
async function onSaveClick() {
  try {
    // Prefer the live, in-memory data edited by Admin UI
    let data = (typeof window.getDirectoryData === "function" && window.getDirectoryData()) ||
               (Array.isArray(window.rawData) ? window.rawData : null);

    // If we couldn't read it, fall back to Git (won't have your edits though)
    if (!Array.isArray(data)) {
      data = await fetchCurrentFromGit();
      if (!Array.isArray(data)) {
        alert("Could not access directory data.");
        return;
      }
    }

    const res = await fetch(SAVE_URL, {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        json: data,
        message: `Admin update from directory page (${new Date().toISOString()})`,
        owner: GH_OWNER, repo: GH_REPO, path: GH_PATH, branch: GH_BRANCH
      })
    });

    const text = await res.text();
    if (!res.ok) throw new Error(text || ("HTTP " + res.status));

    alert("Saved to GitHub successfully.");
    // Reload the page so it re-fetches latest JSON and re-renders
    location.reload();
  } catch (e) {
    console.error(e);
    alert("Save failed: " + (e.message || e));
  }
}

/* main */
function injectWhenReady() {
  const legacy = findLegacyCopyBtn();
  const exists = document.getElementById("sth-save-to-github");

  // Only show while in Admin mode
  if (inAdminMode()) {
    if (!exists) {
      const btn = makeSaveBtn();
      btn.id = "sth-save-to-github";
      if (legacy && legacy.parentNode) {
        legacy.style.display = "none";
        legacy.parentNode.insertBefore(btn, legacy.nextSibling);
      } else {
        // fallback position
        const header = document.querySelector("header .wrap") || document.body;
        header.appendChild(btn);
      }
    }
  } else {
    // Not admin -> ensure button is hidden
    if (legacy) legacy.style.display = "";
    const b = document.getElementById("sth-save-to-github");
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }
}

/* run and observe changes (Admin button toggles the class dynamically) */
document.addEventListener("DOMContentLoaded", () => {
  injectWhenReady();
  const mo = new MutationObserver(injectWhenReady);
  mo.observe(document.body, { attributes:true, attributeFilter:["class"], childList:true, subtree:true });
});
