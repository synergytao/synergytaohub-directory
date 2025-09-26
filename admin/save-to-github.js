/* admin/save-to-github.js — stable API + inline JSON editor for reliable saves */
const SAVE_URL  = "https://sth-directory-proxy.vercel.app/api/save";
const API_KEY   = "ST_Admin_Pass"; // must match Vercel env CLIENT_SHARED_KEY

const GH_OWNER  = "synergytao";
const GH_REPO   = "synergytaohub-directory";
const GH_PATH   = "data/directory.json";
const GH_BRANCH = "main";

// expose for quick debugging
window.__SAVE_URL = SAVE_URL;

function isAdmin() {
  return location.search.includes("admin=1")
      || document.body.classList.contains("is-admin")
      || localStorage.getItem("sth_admin")==="1";
}

/* ---------- JSON editor UI (admin only) ---------- */
let editorOpen = false;
function openJsonEditor(prefill) {
  if (document.getElementById("sth-json-editor-wrap")) { editorOpen = true; return; }

  const wrap = document.createElement("div");
  wrap.id = "sth-json-editor-wrap";
  wrap.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:10000;
    display:flex; align-items:center; justify-content:center; padding:24px;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    width:min(1100px, 95vw); height:min(80vh, 900px); background:#fff; border-radius:14px;
    box-shadow:0 10px 40px rgba(0,0,0,.25); display:flex; flex-direction:column; overflow:hidden;
  `;

  const head = document.createElement("div");
  head.style.cssText = "padding:14px 16px; font-weight:700; border-bottom:1px solid #e5e7eb; display:flex; gap:8px; align-items:center; justify-content:space-between;";
  head.innerHTML = `<div>Directory JSON (editing <code>${GH_PATH}</code>)</div>`;

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText = "padding:8px 12px; border-radius:10px; border:1px solid #cbd5e1; background:#f8fafc; cursor:pointer;";
  closeBtn.onclick = () => { editorOpen = false; wrap.remove(); };

  head.appendChild(closeBtn);

  const ta = document.createElement("textarea");
  ta.id = "sth-json-editor";
  ta.style.cssText = "flex:1; width:100%; border:0; outline:none; padding:14px; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:13px; background:#f9fafb;";
  ta.value = prefill || "[]";

  const foot = document.createElement("div");
  foot.style.cssText = "padding:12px 16px; border-top:1px solid #e5e7eb; display:flex; gap:8px; justify-content:flex-end;";

  const formatBtn = document.createElement("button");
  formatBtn.textContent = "Format";
  formatBtn.style.cssText = "padding:8px 12px; border-radius:10px; border:1px solid #cbd5e1; background:#f1f5f9; cursor:pointer;";
  formatBtn.onclick = () => {
    try { ta.value = JSON.stringify(JSON.parse(ta.value), null, 2); }
    catch (e) { alert("JSON error: " + e.message); }
  };

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save to GitHub";
  saveBtn.style.cssText = "padding:10px 14px; border-radius:12px; border:0; background:#2F6E4E; color:#fff; font-weight:700; cursor:pointer;";
  saveBtn.onclick = () => onSaveClick(ta.value);

  foot.appendChild(formatBtn);
  foot.appendChild(saveBtn);

  box.appendChild(head);
  box.appendChild(ta);
  box.appendChild(foot);
  wrap.appendChild(box);
  document.body.appendChild(wrap);
  editorOpen = true;
}

async function fetchCommittedJson() {
  const url = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${GH_PATH}?t=${Date.now()}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Could not fetch committed JSON");
  return r.json();
}

async function openEditorWithCurrent() {
  try {
    // Prefer in-memory data if present
    let data = null;
    if (typeof window.getDirectoryData === "function") {
      try { data = window.getDirectoryData(); } catch {}
    }
    if (!Array.isArray(data) && Array.isArray(window.rawData)) data = window.rawData;

    // Fallback to committed JSON
    if (!Array.isArray(data)) data = await fetchCommittedJson();

    openJsonEditor(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
    alert("Could not open editor: " + (e.message || e));
  }
}

/* ---------- Save logic ---------- */
async function onSaveClick(possibleJsonText) {
  try {
    let data = null;

    // If editor is open or a string was provided, trust the textarea content
    if (editorOpen || typeof possibleJsonText === "string") {
      let parsed = null;
      try { parsed = JSON.parse(possibleJsonText); }
      catch (e) { return alert("JSON error: " + e.message); }
      if (!Array.isArray(parsed)) return alert("JSON must be an array of entries.");
      data = parsed;
    }

    // Fallbacks: in-memory helpers
    if (!data && typeof window.getDirectoryData === "function") {
      try { data = window.getDirectoryData(); } catch {}
    }
    if (!data && Array.isArray(window.rawData)) data = window.rawData;

    // Last resort: committed JSON
    if (!data) data = await fetchCommittedJson();

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
    console.log("Save result:", text);
    // reload to pull latest JSON for the UI
    location.reload();
  } catch (e) {
    console.error("Save error. SAVE_URL=", SAVE_URL, e);
    alert("Save failed: " + (e.message || e));
  }
}

/* ---------- Buttons (admin only) ---------- */
function injectAdminButtons() {
  if (!isAdmin()) return;

  // Avoid duplicates
  if (!document.getElementById("sth-save-to-github")) {
    const save = document.createElement("button");
    save.id = "sth-save-to-github";
    save.type = "button";
    save.textContent = "Save to GitHub";
    save.style.cssText = "position:fixed;right:24px;bottom:24px;z-index:9999;padding:10px 14px;background:#2F6E4E;color:#fff;border:2px solid #2F6E4E;border-radius:12px;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,.15);cursor:pointer";
    save.addEventListener("click", () => onSaveClick());
    document.body.appendChild(save);
  }

  if (!document.getElementById("sth-edit-json")) {
    const edit = document.createElement("button");
    edit.id = "sth-edit-json";
    edit.type = "button";
    edit.textContent = "Edit JSON";
    edit.style.cssText = "position:fixed;right:24px;bottom:72px;z-index:9999;padding:9px 12px;background:#0f766e;color:#fff;border:2px solid #0f766e;border-radius:10px;font-weight:700;box-shadow:0 6px 16px rgba(0,0,0,.12);cursor:pointer";
    edit.addEventListener("click", openEditorWithCurrent);
    document.body.appendChild(edit);
  }
}

/* Keep window.rawData synced if the page defines it */
function syncWindowRawData() {
  try {
    if (typeof rawData !== "undefined") {
      window.rawData = rawData;
      setInterval(() => { try { window.rawData = rawData; } catch{} }, 500);
    }
  } catch {}
}

/* Init */
(function start(){
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { injectAdminButtons(); syncWindowRawData(); });
  } else {
    injectAdminButtons(); syncWindowRawData();
  }
})();
