// save-to-github.js
const SAVE_URL = "https://sth-directory-proxy-hbrchnjig-synergytaos-projects.vercel.app/api/save";

async function saveToGitHub(updatedData) {
  try {
    const response = await fetch(SAVE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: "businesses.json",
        content: JSON.stringify(updatedData, null, 2),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      alert(`Save failed: ${errorText}`);
      return;
    }

    const result = await response.json();
    alert("Save successful! 🎉");
    console.log("GitHub update result:", result);
  } catch (error) {
    console.error("Error saving to GitHub:", error);
    alert("Save failed: " + error.message);
  }
}

// Add the Save button (only visible in admin mode)
function addSaveButton() {
  if (document.getElementById("save-to-github-btn")) return; // Prevent duplicates

  const btn = document.createElement("button");
  btn.id = "save-to-github-btn";
  btn.textContent = "Save to GitHub";
  btn.style.position = "fixed";
  btn.style.bottom = "20px";
  btn.style.right = "20px";
  btn.style.padding = "10px 20px";
  btn.style.background = "#136f63";
  btn.style.color = "white";
  btn.style.border = "none";
  btn.style.borderRadius = "8px";
  btn.style.cursor = "pointer";
  btn.style.fontSize = "16px";
  btn.style.zIndex = "1000";

  btn.onclick = () => {
    if (typeof getUpdatedBusinesses === "function") {
      const updatedData = getUpdatedBusinesses();
      saveToGitHub(updatedData);
    } else {
      alert("Admin mode not active or update function missing.");
    }
  };

  document.body.appendChild(btn);
}

// Expose globally so admin mode can call it
window.addSaveButton = addSaveButton;
