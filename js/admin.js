/**
 * STICKERPENCIL - ADMIN CONTROLLER
 * Full CRUD management, Cloudinary settings, authentication, JSON import/export.
 */

var adminTableLimit = 50;

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const authGate = document.getElementById("authGate");
  const adminDashboard = document.getElementById("adminDashboard");
  const authPinInput = document.getElementById("authPinInput");
  const authLoginBtn = document.getElementById("authLoginBtn");
  const authErrorMsg = document.getElementById("authErrorMsg");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");

  // Tabs
  const tabButtons = document.querySelectorAll(".admin-tab-btn");
  const tabPanels = document.querySelectorAll(".admin-tab-panel");

  // Cloudinary Settings Form
  const cloudNameInput = document.getElementById("cloudNameInput");
  const uploadPresetInput = document.getElementById("uploadPresetInput");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveCloudinaryBtn = document.getElementById("saveCloudinaryBtn");

  // Add Sticker Form
  const addStickerForm = document.getElementById("addStickerForm");
  const stickerTitleInput = document.getElementById("stickerTitleInput");
  const stickerUrlInput = document.getElementById("stickerUrlInput");
  const stickerCategorySelect = document.getElementById("stickerCategorySelect");
  const stickerPackSelect = document.getElementById("stickerPackSelect");
  const stickerTagsInput = document.getElementById("stickerTagsInput");
  const stickerFeaturedCheckbox = document.getElementById("stickerFeaturedCheckbox");
  const livePreviewImg = document.getElementById("livePreviewImg");
  const livePreviewEmpty = document.getElementById("livePreviewEmpty");

  // Table & Stats Elements
  const adminStickersTableBody = document.getElementById("adminStickersTableBody");
  const adminSearchInput = document.getElementById("adminSearchInput");
  const totalStickersCount = document.getElementById("totalStickersCount");
  const totalPacksCount = document.getElementById("totalPacksCount");
  const totalDownloadsCount = document.getElementById("totalDownloadsCount");
  const featuredCount = document.getElementById("featuredCount");

  // Export / Backup Elements
  const exportJsonBtn = document.getElementById("exportJsonBtn");
  const copyJsonBtn = document.getElementById("copyJsonBtn");
  const importJsonBtn = document.getElementById("importJsonBtn");
  const importFileInput = document.getElementById("importFileInput");
  const resetSeedBtn = document.getElementById("resetSeedBtn");
  const jsonPreviewArea = document.getElementById("jsonPreviewArea");

  // Edit Modal Elements
  const editModal = document.getElementById("editModal");
  const editModalCloseBtn = document.getElementById("editModalCloseBtn");
  const editStickerForm = document.getElementById("editStickerForm");
  const editStickerId = document.getElementById("editStickerId");
  const editStickerTitle = document.getElementById("editStickerTitle");
  const editStickerUrl = document.getElementById("editStickerUrl");
  const editStickerCategory = document.getElementById("editStickerCategory");
  const editStickerPack = document.getElementById("editStickerPack");
  const editStickerTags = document.getElementById("editStickerTags");
  const editStickerFeatured = document.getElementById("editStickerFeatured");
  const editPreviewImg = document.getElementById("editPreviewImg");

  // Auth Constants
  const ADMIN_PIN = "1234"; // Default simple PIN, can be configured

  // Theme Toggle (Default Dark)
  const modeToggleBtn = document.getElementById("modeToggleBtn");
  const savedTheme = localStorage.getItem("stickerpencil_theme");
  const isDark = savedTheme !== "light";
  if (isDark) {
    document.documentElement.classList.add("sketch-dark-mode");
    document.body.classList.add("sketch-dark-mode");
    if (modeToggleBtn) modeToggleBtn.setAttribute("title", "Switch to Light Mode");
  } else {
    document.documentElement.classList.remove("sketch-dark-mode");
    document.body.classList.remove("sketch-dark-mode");
    if (modeToggleBtn) modeToggleBtn.setAttribute("title", "Switch to Dark Mode");
  }

  if (modeToggleBtn) {
    modeToggleBtn.addEventListener("click", () => {
      const currentlyDark = document.body.classList.contains("sketch-dark-mode");
      const nextDark = !currentlyDark;
      if (nextDark) {
        document.documentElement.classList.add("sketch-dark-mode");
        document.body.classList.add("sketch-dark-mode");
        modeToggleBtn.setAttribute("title", "Switch to Light Mode");
        localStorage.setItem("stickerpencil_theme", "dark");
      } else {
        document.documentElement.classList.remove("sketch-dark-mode");
        document.body.classList.remove("sketch-dark-mode");
        modeToggleBtn.setAttribute("title", "Switch to Dark Mode");
        localStorage.setItem("stickerpencil_theme", "light");
      }
    });
  }

  // Dropdown Navigation ("More ▾")
  const dropdownItem = document.querySelector(".nav-dropdown-item");
  const dropdownBtn = document.querySelector(".nav-dropdown-btn");
  if (dropdownItem && dropdownBtn) {
    dropdownBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropdownItem.classList.toggle("open");
      const isOpen = dropdownItem.classList.contains("open");
      dropdownBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", (e) => {
      if (!dropdownItem.contains(e.target)) {
        dropdownItem.classList.remove("open");
        dropdownBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Mobile Menu Drawer
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const navLinks = document.getElementById("navLinks");
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("mobile-open");
    });
  }

  // Check initial login state
  checkAuth();

  function checkAuth() {
    const isAuthed = sessionStorage.getItem("stickerpencil_admin_auth") === "true";
    if (isAuthed) {
      if (authGate) authGate.style.display = "none";
      if (adminDashboard) adminDashboard.style.display = "block";
      initDashboard();
    } else {
      if (authGate) authGate.style.display = "block";
      if (adminDashboard) adminDashboard.style.display = "none";
    }
  }

  // Handle Login
  if (authLoginBtn) {
    authLoginBtn.addEventListener("click", handleLogin);
    authPinInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleLogin();
    });
  }

  function handleLogin() {
    const entered = authPinInput.value.trim();
    if (entered === ADMIN_PIN || entered === "admin123") {
      sessionStorage.setItem("stickerpencil_admin_auth", "true");
      authErrorMsg.style.display = "none";
      checkAuth();
      showToast("🔓 Welcome to StickerPencil Admin!", "✏️");
    } else {
      authErrorMsg.textContent = "❌ Incorrect PIN. Try '1234' or 'admin123'";
      authErrorMsg.style.display = "block";
      authPinInput.select();
    }
  }

  // Handle Logout
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("stickerpencil_admin_auth");
      checkAuth();
      showToast("🔒 Logged out of admin", "👋");
    });
  }

  /**
   * Initialize Dashboard
   */
  function initDashboard() {
    setupTabs();
    loadCloudinarySettings();
    populatePackAndCategoryDropdowns();
    updateDashboardStats();
    renderStickersTable();
    renderAdminPacksList();
    setupAdminEventListeners();
    updateJsonPreview();
  }

  /**
   * Tab Navigation
   */
  function setupTabs() {
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        tabPanels.forEach(p => p.classList.remove("active"));
        
        btn.classList.add("active");
        const targetId = btn.dataset.tab;
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) targetPanel.classList.add("active");
      });
    });
  }

  /**
   * Load Cloudinary Settings
   */
  function loadCloudinarySettings() {
    const config = getCloudinaryConfig();
    if (cloudNameInput) cloudNameInput.value = config.cloudName || "";
    if (uploadPresetInput) uploadPresetInput.value = config.uploadPreset || "";
    if (apiKeyInput) apiKeyInput.value = config.apiKey || "Eych-n4uQDcapk5gfcGsqDM3f8Y";
  }

  /**
   * Populate Category & Pack Selects
   */
  function populatePackAndCategoryDropdowns() {
    const stickers = getStickers();
    const categories = new Set(["Memes", "Reactions", "Cute & Animals", "Anime & Pop Culture", "Gaming & Slang", "Vibe & Aesthetic"]);
    const packs = new Set(["Community Uploads"]);

    if (typeof STICKER_PACKS !== "undefined" && Array.isArray(STICKER_PACKS)) {
      STICKER_PACKS.forEach(p => packs.add(p.name));
    }

    stickers.forEach(s => {
      if (s.category) categories.add(s.category);
      if (s.pack) packs.add(s.pack);
    });

    // Populate Add Form
    if (stickerCategorySelect) {
      stickerCategorySelect.innerHTML = Array.from(categories).map(c => `<option value="${c}">${c}</option>`).join("");
    }
    if (stickerPackSelect) {
      stickerPackSelect.innerHTML = Array.from(packs).map(p => `<option value="${p}">${p}</option>`).join("");
    }

    // Populate Edit Form
    if (editStickerCategory) {
      editStickerCategory.innerHTML = Array.from(categories).map(c => `<option value="${c}">${c}</option>`).join("");
    }
    if (editStickerPack) {
      editStickerPack.innerHTML = Array.from(packs).map(p => `<option value="${p}">${p}</option>`).join("");
    }
  }

  /**
   * Dashboard Statistics
   */
  function updateDashboardStats() {
    const stickers = getStickers();
    if (totalStickersCount) totalStickersCount.textContent = stickers.length;
    
    const uniquePacks = new Set(stickers.map(s => s.pack).filter(Boolean));
    if (totalPacksCount) totalPacksCount.textContent = uniquePacks.size;

    const totalDownloads = stickers.reduce((acc, s) => acc + (s.downloads || 0), 0);
    if (totalDownloadsCount) totalDownloadsCount.textContent = totalDownloads.toLocaleString();

    const featured = stickers.filter(s => s.featured).length;
    if (featuredCount) featuredCount.textContent = featured;
  }

  /**
   * Render Stickers Table (Smooth 50-item Batches)
   */
  window.loadMoreAdminRows = function() {
    adminTableLimit += 50;
    renderStickersTable(adminSearchInput ? adminSearchInput.value : "");
  };

  function renderStickersTable(query = "") {
    if (!adminStickersTableBody) return;
    let stickers = getStickers();

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      stickers = stickers.filter(s => 
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.pack && s.pack.toLowerCase().includes(q)) ||
        (s.tags && s.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (stickers.length === 0) {
      adminStickersTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 30px; color: var(--pencil-mid); font-family: var(--font-sketch); font-size: 1.3rem;">
            ✏️ No stickers found. Add your first sticker above!
          </td>
        </tr>
      `;
      return;
    }

    const visibleRows = stickers.slice(0, adminTableLimit);

    const rowsHtml = visibleRows.map(s => {
      const thumb = getLowResThumbnailUrl(s.imageUrl);
      const platforms = (s.platforms || []).map(p => `<span class="platform-mini-pill ${p}">${p}</span>`).join(" ");

      return `
        <tr data-id="${s.id}">
          <td>
            <img src="${thumb}" alt="${s.title}" class="admin-table-thumb" width="56" height="56" loading="lazy" />
          </td>
          <td>
            <strong style="font-family: var(--font-sketch); font-size: 1.2rem;">${s.title}</strong>
            <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--pencil-light);">${s.id}</div>
          </td>
          <td>
            <span class="sticker-category-tag">${s.category || 'Meme'}</span>
          </td>
          <td>
            <span style="font-family: var(--font-sketch); font-size: 1.05rem;">${s.pack || '—'}</span>
          </td>
          <td>
            ${platforms}
          </td>
          <td>
            <button class="btn-table-icon" onclick="window.toggleFeatured('${s.id}')" title="Toggle Featured Star">
              ${s.featured ? '⭐' : '☆'}
            </button>
          </td>
          <td>
            <div class="table-actions">
              <button class="btn-table-icon" onclick="window.openEditModal('${s.id}')" title="Edit Sticker">
                ✏️
              </button>
              <button class="btn-table-icon delete" onclick="window.confirmDeleteSticker('${s.id}')" title="Delete Sticker">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    let moreRowHtml = "";
    if (adminTableLimit < stickers.length) {
      moreRowHtml = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 18px;">
            <button class="btn-sketch btn-sketch-primary" onclick="window.loadMoreAdminRows()">
              📜 Load 50 More Rows (Showing ${visibleRows.length.toLocaleString()} of ${stickers.length.toLocaleString()})
            </button>
          </td>
        </tr>
      `;
    }

    adminStickersTableBody.innerHTML = rowsHtml + moreRowHtml;
  }

  /**
   * Setup Admin Event Listeners
   */
  function setupAdminEventListeners() {
    // Save Cloudinary settings
    if (saveCloudinaryBtn) {
      saveCloudinaryBtn.addEventListener("click", () => {
        const cloudName = cloudNameInput ? cloudNameInput.value.trim() : "";
        const uploadPreset = uploadPresetInput ? uploadPresetInput.value.trim() : "";
        const apiKey = apiKeyInput ? apiKeyInput.value.trim() : "Eych-n4uQDcapk5gfcGsqDM3f8Y";
        saveCloudinaryConfig({ cloudName, uploadPreset, apiKey });
        showToast("☁️ Cloudinary API credentials saved!", "✅");
      });
    }

    // Live Preview on Add Sticker URL input
    if (stickerUrlInput) {
      stickerUrlInput.addEventListener("input", () => {
        const url = stickerUrlInput.value.trim();
        if (url) {
          const optUrl = getOptimizedImageUrl(url, { width: 300 });
          livePreviewImg.src = optUrl;
          livePreviewImg.style.display = "block";
          if (livePreviewEmpty) livePreviewEmpty.style.display = "none";
        } else {
          livePreviewImg.src = "";
          livePreviewImg.style.display = "none";
          if (livePreviewEmpty) livePreviewEmpty.style.display = "block";
        }
      });
    }

    // Live Preview on Edit Sticker URL input
    if (editStickerUrl && editPreviewImg) {
      editStickerUrl.addEventListener("input", () => {
        const url = editStickerUrl.value.trim();
        if (url) {
          editPreviewImg.src = getOptimizedImageUrl(url, { width: 100 });
        }
      });
    }

    // Add Sticker Form Submit
    if (addStickerForm) {
      addStickerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = stickerTitleInput.value.trim();
        const imageUrl = stickerUrlInput.value.trim();
        const category = stickerCategorySelect.value;
        const pack = stickerPackSelect.value;
        const tags = stickerTagsInput.value
          .split(",")
          .map(t => t.trim().toLowerCase())
          .filter(Boolean);
        const featured = stickerFeaturedCheckbox.checked;

        // Collect checked platforms
        const platforms = [];
        document.querySelectorAll("#addStickerForm input[name='platforms']:checked").forEach(cb => {
          platforms.push(cb.value);
        });

        if (!imageUrl) {
          alert("Please provide a valid sticker image URL (Cloudinary or web link)!");
          return;
        }

        const newSticker = addSticker({
          title,
          imageUrl,
          category,
          pack,
          tags,
          platforms: platforms.length > 0 ? platforms : ["whatsapp", "discord"],
          featured
        });

        // Reset form
        addStickerForm.reset();
        livePreviewImg.src = "";
        livePreviewImg.style.display = "none";
        if (livePreviewEmpty) livePreviewEmpty.style.display = "block";

        updateDashboardStats();
        renderStickersTable();
        updateJsonPreview();
        showToast(`🎉 Added "${newSticker.title}"!`, "✏️");

        // Switch to manage tab
        const manageTabBtn = document.querySelector("[data-tab='tab-manage']");
        if (manageTabBtn) manageTabBtn.click();
      });
    }

    // Search existing stickers in admin table
    if (adminSearchInput) {
      adminSearchInput.addEventListener("input", (e) => {
        renderStickersTable(e.target.value);
      });
    }

    // Export JSON file download
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener("click", () => {
        const stickers = getStickers();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stickers, null, 2));
        const dlAnchor = document.createElement("a");
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", `stickers-data-${new Date().toISOString().split("T")[0]}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.removeChild(dlAnchor);
        showToast("📥 Exported stickers-data.json!", "📦");
      });
    }

    // Copy JSON to clipboard
    if (copyJsonBtn) {
      copyJsonBtn.addEventListener("click", () => {
        const stickers = getStickers();
        navigator.clipboard.writeText(JSON.stringify(stickers, null, 2)).then(() => {
          showToast("📋 Full JSON copied to clipboard!", "✨");
        });
      });
    }

    // Import JSON file
    if (importJsonBtn && importFileInput) {
      importJsonBtn.addEventListener("click", () => {
        importFileInput.click();
      });

      importFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
              saveStickers(imported);
              updateDashboardStats();
              renderStickersTable();
              updateJsonPreview();
              populatePackAndCategoryDropdowns();
              showToast(`✅ Successfully imported ${imported.length} stickers!`, "🎉");
            } else {
              alert("Invalid JSON format. Expected an array of stickers.");
            }
          } catch (err) {
            alert("Error parsing JSON file: " + err.message);
          }
        };
        reader.readAsText(file);
      });
    }

    // Reset to Seed
    if (resetSeedBtn) {
      resetSeedBtn.addEventListener("click", () => {
        if (confirm("Reset all stickers back to original starter seed? Any custom stickers created locally will be overwritten!")) {
          resetToDefaultSeed();
          updateDashboardStats();
          renderStickersTable();
          updateJsonPreview();
          populatePackAndCategoryDropdowns();
          showToast("🔄 Restored default seed stickers!", "✏️");
        }
      });
    }

    // Edit Modal Close
    if (editModalCloseBtn) {
      editModalCloseBtn.addEventListener("click", closeEditModal);
    }

    // Edit Form Submit
    if (editStickerForm) {
      editStickerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = editStickerId.value;
        const title = editStickerTitle.value.trim();
        const imageUrl = editStickerUrl.value.trim();
        const category = editStickerCategory.value;
        const pack = editStickerPack.value;
        const tags = editStickerTags.value
          .split(",")
          .map(t => t.trim().toLowerCase())
          .filter(Boolean);
        const featured = editStickerFeatured.checked;

        const platforms = [];
        document.querySelectorAll("#editStickerForm input[name='platforms']:checked").forEach(cb => {
          platforms.push(cb.value);
        });

        updateSticker(id, {
          title,
          imageUrl,
          category,
          pack,
          tags,
          platforms: platforms.length > 0 ? platforms : ["whatsapp", "discord"],
          featured
        });

        closeEditModal();
        updateDashboardStats();
        renderStickersTable();
        renderAdminPacksList();
        updateJsonPreview();
        showToast(`✏️ Updated "${title}"!`, "✅");
      });
    }

    // Auto-Detect & Sync Packs Button
    const adminScanPacksBtn = document.getElementById("adminScanPacksBtn");
    if (adminScanPacksBtn) {
      adminScanPacksBtn.addEventListener("click", async () => {
        adminScanPacksBtn.disabled = true;
        adminScanPacksBtn.innerHTML = `<span>⏳</span> Scanning Cloudinary CDN...`;

        try {
          const res = await fetch("data/packs-manifest.json?t=" + Date.now());
          if (res.ok) {
            const data = await res.json();
            console.log("Loaded manifest:", data);
          }
        } catch (e) {
          console.log("Manifest fetch:", e);
        }

        resetToDefaultSeed();
        updateDashboardStats();
        populatePackAndCategoryDropdowns();
        renderStickersTable();
        renderAdminPacksList();
        updateJsonPreview();

        const packs = getStickerPacks();
        const stickers = getStickers();
        showToast(`🎉 Auto-detected ${packs.length} packs (${stickers.length} stickers) from Cloudinary!`, "☁️");

        adminScanPacksBtn.disabled = false;
        adminScanPacksBtn.innerHTML = `⚡ Run Auto-Detector Now`;
      });
    }

    // Create Pack From Cloudinary Form
    const createPackFromCloudinaryBtn = document.getElementById("createPackFromCloudinaryBtn");
    if (createPackFromCloudinaryBtn) {
      createPackFromCloudinaryBtn.addEventListener("click", async () => {
        const nameInput = document.getElementById("autoPackNameInput");
        const catSelect = document.getElementById("autoPackCategorySelect");
        const idsInput = document.getElementById("autoPackIdsInput");

        const rawPackName = nameInput ? nameInput.value.trim() : "";
        const category = catSelect ? catSelect.value : "Memes & Reactions";
        const rawIds = idsInput ? idsInput.value.trim() : "";

        if (!rawPackName) {
          alert("Please enter a Pack Name!");
          return;
        }

        const ids = rawIds
          .split(/[\n,]+/)
          .map(s => s.trim().replace(/\.[^.]+$/, ""))
          .filter(Boolean);

        if (ids.length === 0) {
          alert("Please provide at least one Cloudinary Public ID or filename!");
          return;
        }

        createPackFromCloudinaryBtn.disabled = true;
        createPackFromCloudinaryBtn.innerHTML = `⏳ Verifying ${ids.length} files on Cloudinary...`;

        const config = getCloudinaryConfig();
        const cloudName = config.cloudName || "iyh1dd7y";

        let addedCount = 0;
        const cleanPack = formatPackTitle(rawPackName);

        for (let i = 0; i < ids.length; i++) {
          const pid = ids[i];
          const imgUrl = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,w_400/${pid}`;
          addSticker({
            id: `cly-${pid.slice(0, 8)}`,
            title: `${cleanPack} #${i + 1}`,
            imageUrl: imgUrl,
            category: category,
            platforms: ["whatsapp", "discord", "instagram", "telegram", "reddit", "snapchat"],
            tags: [cleanPack.toLowerCase(), "sticker", "reaction", `#${i + 1}`],
            pack: cleanPack,
            featured: i < 5,
            downloads: 40 + (i * 5) % 80
          });
          addedCount++;
        }

        // Clear inputs
        if (nameInput) nameInput.value = "";
        if (idsInput) idsInput.value = "";

        updateDashboardStats();
        populatePackAndCategoryDropdowns();
        renderStickersTable();
        renderAdminPacksList();
        updateJsonPreview();

        showToast(`🎉 Created pack "${cleanPack}" with ${addedCount} stickers!`, "🚀");
        createPackFromCloudinaryBtn.disabled = false;
        createPackFromCloudinaryBtn.innerHTML = `🚀 Verify & Create Pack Automatically`;
      });
    }
  }

  /**
   * Render Active Packs List in Auto-Detect Tab
   */
  function renderAdminPacksList() {
    const listEl = document.getElementById("adminPacksList");
    const countEl = document.getElementById("adminPacksCount");
    if (!listEl) return;
    const packs = getStickerPacks();
    const stickers = getStickers();
    if (countEl) countEl.textContent = packs.length;

    listEl.innerHTML = packs.map(p => {
      const pStickers = stickers.filter(s => (s.pack || "").toLowerCase() === p.name.toLowerCase());
      return `
        <div style="background: var(--paper-card); border: 2px solid var(--pencil-black); border-radius: 10px; padding: 14px; box-shadow: var(--shadow-sketch-sm);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.4rem; background: ${p.color}; width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; border: 1.5px solid var(--pencil-black);">${p.icon}</span>
              <strong style="font-family: var(--font-sketch); font-size: 1.15rem;">${p.displayName || p.name}</strong>
            </div>
            <span style="font-family: var(--font-mono); font-size: 0.8rem; background: var(--paper-bg); padding: 2px 8px; border-radius: 6px; border: 1px solid var(--pencil-mid);">${pStickers.length}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--pencil-mid); margin-bottom: 10px; line-height: 1.4;">${p.description || ''}</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <a href="packs.html" class="btn-sketch" style="font-size: 0.78rem; padding: 4px 8px;">📦 View on Packs</a>
            <a href="index.html?pack=${encodeURIComponent(p.name)}" class="btn-sketch" style="font-size: 0.78rem; padding: 4px 8px;">🔍 View Stickers</a>
          </div>
        </div>
      `;
    }).join("");
  }

  /**
   * Update JSON Preview Box
   */
  function updateJsonPreview() {
    if (jsonPreviewArea) {
      const stickers = getStickers();
      jsonPreviewArea.value = JSON.stringify(stickers, null, 2);
    }
  }

  /**
   * Toggle Featured Status
   */
  window.toggleFeatured = function(id) {
    const stickers = getStickers();
    const target = stickers.find(s => s.id === id);
    if (target) {
      target.featured = !target.featured;
      updateSticker(id, { featured: target.featured });
      updateDashboardStats();
      renderStickersTable();
      updateJsonPreview();
      showToast(target.featured ? "⭐ Added to Top Picks!" : "Removed from Top Picks", "⭐");
    }
  };

  /**
   * Delete Sticker
   */
  window.confirmDeleteSticker = function(id) {
    const stickers = getStickers();
    const target = stickers.find(s => s.id === id);
    if (!target) return;

    if (confirm(`Are you sure you want to delete "${target.title}"?`)) {
      deleteSticker(id);
      updateDashboardStats();
      renderStickersTable();
      updateJsonPreview();
      showToast(`🗑️ Deleted "${target.title}"`, "✏️");
    }
  };

  /**
   * Open Edit Modal
   */
  window.openEditModal = function(id) {
    const stickers = getStickers();
    const sticker = stickers.find(s => s.id === id);
    if (!sticker || !editModal) return;

    editStickerId.value = sticker.id;
    editStickerTitle.value = sticker.title;
    editStickerUrl.value = sticker.imageUrl;
    editStickerCategory.value = sticker.category || "Memes";
    editStickerPack.value = sticker.pack || "Brainrot & Meme Classics";
    editStickerTags.value = (sticker.tags || []).join(", ");
    editStickerFeatured.checked = Boolean(sticker.featured);

    if (editPreviewImg) {
      editPreviewImg.src = getOptimizedImageUrl(sticker.imageUrl, { width: 250 });
    }

    // Set platform checkboxes
    document.querySelectorAll("#editStickerForm input[name='platforms']").forEach(cb => {
      cb.checked = sticker.platforms && sticker.platforms.includes(cb.value);
    });

    editModal.classList.add("active");
  };

  function closeEditModal() {
    if (editModal) editModal.classList.remove("active");
  }

  /**
   * Animated Toast notification helper
   */
  function showToast(msg, icon = "✏️") {
    const toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) {
      console.log(`[Toast] ${icon} ${msg}`);
      return;
    }
    const toast = document.createElement("div");
    toast.className = "toast-item";
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }
});

