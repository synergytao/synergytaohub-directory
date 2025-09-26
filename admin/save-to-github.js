/* Synergy Tao – Save-to-GitHub injector (iframe-safe, conflict-free) */

/* ====== CONFIG – EDIT THIS ONE LINE ====== */
const SAVE_URL  = "https://sth-directory-proxy-3uexdgi1m-synergytaos-projects.vercel.app/api/save";
/* ======================================== */

const DATA_URL  = "https://raw.githubusercontent.com/synergytao/synergytaohub-directory/main/data/directory.json";
const API_KEY   = "ST_Admin_Pas"; // must match Vercel CLIENT_SHARED_KEY
const GH_OWNER  = "synergytao";
const GH_REPO   = "synergytaohub-directory";
const GH_PATH   = "data/directory.json";
const GH_BRANCH = "main";

(function () {
  const forceShow = !!window.STH_ADMIN_ALWAYS || location.search.includes("admin=1");

  async function fetchCurrentFromGit() {
    const res = await fetch(DATA_URL + "?t=" + Date.now());
    return await res.json();
  }

  async function onSaveClick() {
    try {
      // Prefer live data from the page (admin edits)
      let data = null;
      try {
        if (typeof window.getDirectoryData === "function") data = window.getDirectoryData();
        if (!Array.isArray(data) && Array.isArray(window.rawData)) data = window.rawData;
      } catch (_) {}

      // Fallback to committed data
      if (!Array.isArray(data)) data = await fetchCurrentFromGit();
      if (!Array.isArray(data)) { alert("Could not access directory data."); return; }

      const res = await fetch(SAVE_URL, {
        method: "POST",
        headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          json: data,
          message: `Admin update from directory page (${new Date().toISOString()})`,
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

  function hideLegacyCopyBtn() {
    try {
      const byId = document.getElementById("copyBtn");
      if (byId) byId.style.display = "none";
      const buttons = document.querySelectorAll("button,a");
      for (const el of buttons) {
        const t = (el.textContent || "").trim().toLowerCase();
        if (t.includes("copy") && t.includes("updated") && t.includes("json")) {
          el.style.display = "none";
        }
      }
    } catch (_) {}
  }

  function injectButton() {
    if (!forceShow) return; // only show when told to
    if (document.getElementById("sth-save-to-github")) return;

    const b = document.createElement("button");
    b.id = "sth-save-to-github";
    b.type = "button";
    b.textContent = "Save to GitHub";
    b.style.position = "fixed";
    b.style.right = "24px";
    b.style.bottom = "24px";
    b.style.zIndex = "9999";
    b.style.padding = "10px 14px";
    b.style.background = "#2F6E4E";
    b.style.color = "#fff";
    b.style.border = "2px solid #2F6E4E";
    b.style.borderRadius = "12px";
    b.style.fontWeight = "700";
    b.style.boxShadow = "0 6px 20px rgba(0,0,0,.15)";
    b.style.cursor = "pointer";
    b.addEventListener("click", onSaveClick);
    document.body.appendChild(b);
  }

  function syncWindowRawData() {
    // If the page uses a local 'rawData' variable, mirror it so the saver can read it
    try {
      if (typeof rawData !== "undefined") {
        window.rawData = rawData;
        setInterval(() => { try { window.rawData = rawData; } catch(_){} }, 500);
      }
    } catch (_) {}
  }

  function start() {
    hideLegacyCopyBtn();
    injectButton();
    syncWindowRawData();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
