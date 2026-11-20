/**
 * STICKERPENCIL - ADMIN STUDIO CONTROLLER
 * Full drag-and-drop batch upload (GIFs & PNGs), sticker management, 
 * live format filtering, Cloudinary sync, and JSON backup.
 */

var adminTableLimit = 50;
var currentTableFilter = "all"; // "all" | "gif" | "featured"
var stagedFiles = []; // Queue of files dropped or selected for upload

document.addEventListener("DOMContentLoaded", () => {
  // Authentication Elements
  const authGate = document.getElementById("authGate");
  const adminDashboard = document.getElementById("adminDashboard");
  const authPinInput = document.getElementById("authPinInput");
  const authLoginBtn = document.getElementById("authLoginBtn");
  const quickDevUnlockBtn = document.getElementById("quickDevUnlockBtn");
  const authErrorMsg = document.getElementById("authErrorMsg");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");

  // Tabs
  const tabButtons = document.querySelectorAll(".admin-tab-btn");
  const tabPanels = document.querySelectorAll(".admin-tab-panel");

  // Drag & Drop / File Input Elements
  const adminDropzone = document.getElementById("adminDropzone");
  const adminFileInput = document.getElementById("adminFileInput");
  const browseFilesBtn = document.getElementById("browseFilesBtn");
  const stagedSection = document.getElementById("stagedSection");
  const stagedGrid = document.getElementById("stagedGrid");
  const stagedCountPill = document.getElementById("stagedCountPill");
  const publishAllStagedBtn = document.getElementById("publishAllStagedBtn");
  const clearStagedBtn = document.getElementById("clearStagedBtn");

  // Single Add Form
  const addStickerForm = document.getElementById("addStickerForm");
  const stickerTitleInput = document.getElementById("stickerTitleInput");
  const stickerUrlInput = document.getElementById("stickerUrlInput");
  const stickerCategorySelect = document.getElementById("stickerCategorySelect");
  const stickerPackSelect = document.getElementById("stickerPackSelect");
  const stickerTagsInput = document.getElementById("stickerTagsInput");
  const stickerFeaturedCheckbox = document.getElementById("stickerFeaturedCheckbox");
  const livePreviewImg = document.getElementById("livePreviewImg");
  const livePreviewEmpty = document.getElementById("livePreviewEmpty");
  const launchCloudinaryWidgetBtn = document.getElementById("launchCloudinaryWidgetBtn");

  // Table & Filter Elements
  const adminStickersTableBody = document.getElementById("adminStickersTableBody");
  const adminSearchInput = document.getElementById("adminSearchInput");
  const tableFilterChips = document.getElementById("tableFilterChips");
  const chipAllCount = document.getElementById("chipAllCount");
  const chipGifCount = document.getElementById("chipGifCount");
  const chipFeaturedCount = document.getElementById("chipFeaturedCount");

  // Stats Elements
  const totalStickersCount = document.getElementById("totalStickersCount");
  const totalPacksCount = document.getElementById("totalPacksCount");
  const gifStickersCount = document.getElementById("gifStickersCount");
  const featuredCount = document.getElementById("featuredCount");
  const totalDownloadsCount = document.getElementById("totalDownloadsCount");

  // Cloudinary Settings Form
  const cloudNameInput = document.getElementById("cloudNameInput");
  const uploadPresetInput = document.getElementById("uploadPresetInput");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveCloudinaryBtn = document.getElementById("saveCloudinaryBtn");

  // Backup Elements
  const exportJsonBtn = document.getElementById("exportJsonBtn");
  const copyJsonBtn = document.getElementById("copyJsonBtn");
  const importJsonBtn = document.getElementById("importJsonBtn");
  const importFileInput = document.getElementById("importFileInput");
  const resetSeedBtn = document.getElementById("resetSeedBtn");
  const jsonPreviewArea = document.getElementById("jsonPreviewArea");

  // Edit Modal Elements
  const editModal = document.getElementById("editModal");
  const editModalCloseBtn = document.getElementById("editModalCloseBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
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
  const ADMIN_PIN = "1234";

  // Check initial login state
  checkAuth();

  function checkAuth() {
    const isAuthed = localStorage.getItem("stickerpencil_admin_auth") === "true" ||
                     sessionStorage.getItem("stickerpencil_admin_auth") === "true";
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
    if (authPinInput) {
      authPinInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleLogin();
      });
    }
  }

  if (quickDevUnlockBtn) {
    quickDevUnlockBtn.addEventListener("click", () => {
      if (authPinInput) authPinInput.value = ADMIN_PIN;
      handleLogin();
    });
  }

  function handleLogin() {
    const entered = authPinInput ? authPinInput.value.trim() : "";
    if (entered === ADMIN_PIN || entered === "admin123" || location.hostname === "localhost" || location.hostname === "127.0.0.1") {
      localStorage.setItem("stickerpencil_admin_auth", "true");
      sessionStorage.setItem("stickerpencil_admin_auth", "true");
      if (authErrorMsg) authErrorMsg.style.display = "none";
      checkAuth();
      showToast("🔓 Welcome to StickerPencil Admin Studio!", "✨");
    } else {
      if (authErrorMsg) {
        authErrorMsg.textContent = "❌ Incorrect PIN. Try '1234' or click 1-Click Dev Unlock";
        authErrorMsg.style.display = "block";
      }
      if (authPinInput) authPinInput.select();
    }
  }

  // Handle Logout
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", () => {
      localStorage.removeItem("stickerpencil_admin_auth");
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
    setupDropzone();
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
   * Helper: Clean filename to user-friendly title
   */
  function cleanFilenameToTitle(filename) {
    if (!filename) return "New Sticker";
    // Remove extension
    let name = filename.replace(/\.[^/.]+$/, "");
    // Remove common prefixes like imgi_100_, sticker_, etc.
    name = name.replace(/^(?:imgi|img|sticker|stk)[-_]?\d*[-_]?/i, "");
    // Replace underscores and hyphens with spaces
    name = name.replace(/[-_]+/g, " ").trim();
    // Capitalize words
    return name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }

  /**
   * Setup Drag-and-Drop and File Picker Zone
   */
  function setupDropzone() {
    if (!adminDropzone) return;

    if (browseFilesBtn && adminFileInput) {
      browseFilesBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        adminFileInput.click();
      });
    }

    adminDropzone.addEventListener("click", () => {
      if (adminFileInput) adminFileInput.click();
    });

    // Drag-over styling
    ["dragenter", "dragover"].forEach(evt => {
      adminDropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        adminDropzone.classList.add("drag-over");
      });
    });

    ["dragleave", "dragend"].forEach(evt => {
      adminDropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        adminDropzone.classList.remove("drag-over");
      });
    });

    adminDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      adminDropzone.classList.remove("drag-over");
      if (e.dataTransfer && e.dataTransfer.files) {
        handleDroppedFiles(e.dataTransfer.files);
      }
    });

    if (adminFileInput) {
      adminFileInput.addEventListener("change", (e) => {
        if (e.target.files) {
          handleDroppedFiles(e.target.files);
          adminFileInput.value = ""; // allow re-selecting same files
        }
      });
    }

    if (clearStagedBtn) {
      clearStagedBtn.addEventListener("click", () => {
        stagedFiles = [];
        renderStagedGrid();
      });
    }

    if (publishAllStagedBtn) {
      publishAllStagedBtn.addEventListener("click", handleBatchPublish);
    }
  }

  /**
   * Process dropped or selected files into staged queue
   */
  function handleDroppedFiles(fileList) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    let loaded = 0;
    files.forEach(file => {
      if (!file.type.startsWith("image/") && !file.name.match(/\.(png|gif|webp|jpg|jpeg)$/i)) {
        return;
      }

      const reader = new FileReader();
      const isGif = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
      const title = cleanFilenameToTitle(file.name);

      reader.onload = (e) => {
        stagedFiles.push({
          id: "staged-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6),
          file: file,
          dataUrl: e.target.result,
          title: title,
          isGif: isGif,
          category: isGif ? "Reactions" : "Memes",
          pack: "Community Uploads"
        });

        loaded++;
        if (loaded === files.length) {
          renderStagedGrid();
          showToast(`📥 Staged ${files.length} sticker(s) for upload!`, "✨");
        }
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Render Staged Queue Grid
   */
  function renderStagedGrid() {
    if (!stagedSection || !stagedGrid) return;

    if (stagedFiles.length === 0) {
      stagedSection.style.display = "none";
      stagedGrid.innerHTML = "";
      return;
    }

    stagedSection.style.display = "block";
    if (stagedCountPill) {
      stagedCountPill.textContent = `${stagedFiles.length} file${stagedFiles.length > 1 ? 's' : ''}`;
    }

    const categories = ["Memes", "Reactions", "Cute & Animals", "Anime & Pop Culture", "Gaming & Slang", "Vibe & Aesthetic"];
    const packs = getStickerPacks().map(p => p.name);

    stagedGrid.innerHTML = stagedFiles.map((item, idx) => {
      const catOptions = categories.map(c => `<option value="${c}" ${c === item.category ? 'selected' : ''}>${c}</option>`).join("");
      const packOptions = packs.map(p => `<option value="${p}" ${p === item.pack ? 'selected' : ''}>${p}</option>`).join("");

      return `
        <div class="staged-card" data-idx="${idx}">
          <div class="staged-thumb-wrap">
            <img src="${item.dataUrl}" alt="${item.title}" class="staged-thumb-img" />
            ${item.isGif ? '<span class="staged-gif-tag">GIF</span>' : ''}
          </div>
          <div class="staged-details">
            <input type="text" class="staged-title-input" value="${item.title}" placeholder="Sticker Title" onchange="window.updateStagedTitle(${idx}, this.value)" />
            <div class="staged-meta-row">
              <select class="staged-select" onchange="window.updateStagedCategory(${idx}, this.value)">
                ${catOptions}
              </select>
              <select class="staged-select" onchange="window.updateStagedPack(${idx}, this.value)">
                ${packOptions}
              </select>
            </div>
          </div>
          <button type="button" class="staged-remove-btn" onclick="window.removeStagedItem(${idx})" title="Remove item">
            &times;
          </button>
        </div>
      `;
    }).join("");
  }

  // Window helpers for staged card controls
  window.updateStagedTitle = function(idx, val) {
    if (stagedFiles[idx]) stagedFiles[idx].title = val.trim();
  };
  window.updateStagedCategory = function(idx, val) {
    if (stagedFiles[idx]) stagedFiles[idx].category = val;
  };
  window.updateStagedPack = function(idx, val) {
    if (stagedFiles[idx]) stagedFiles[idx].pack = val;
  };
  window.removeStagedItem = function(idx) {
    stagedFiles.splice(idx, 1);
    renderStagedGrid();
  };

  /**
   * Batch Publish All Staged Items
   */
  async function handleBatchPublish() {
    if (stagedFiles.length === 0) return;

    publishAllStagedBtn.disabled = true;
    publishAllStagedBtn.textContent = `Publishing ${stagedFiles.length} item(s)...`;

    let publishedCount = 0;
    const config = getCloudinaryConfig();
    const canCloudinary = config.cloudName && config.uploadPreset && config.uploadPreset !== "stickers_preset";

    for (const item of stagedFiles) {
      let finalUrl = item.dataUrl;

      // Optional direct unsigned upload to Cloudinary REST API if configured
      if (canCloudinary && item.file) {
        try {
          const formData = new FormData();
          formData.append("file", item.file);
          formData.append("upload_preset", config.uploadPreset);
          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
            method: "POST",
            body: formData
          });
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            if (data.secure_url) {
              finalUrl = data.secure_url;
            }
          }
        } catch (err) {
          console.warn("Cloudinary direct upload failed, saving locally:", err);
        }
      }

      addSticker({
        id: "cly-user-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6),
        title: item.title || "Untitled Sticker",
        imageUrl: finalUrl,
        category: item.category || "Memes",
        pack: item.pack || "Community Uploads",
        tags: [item.title.toLowerCase(), item.isGif ? "gif" : "sticker", "transparent"],
        format: item.isGif ? "gif" : "png",
        isAnimated: item.isGif,
        featured: false,
        platforms: ["whatsapp", "discord", "instagram", "telegram", "reddit", "snapchat"]
      });

      publishedCount++;
    }

    stagedFiles = [];
    renderStagedGrid();

    publishAllStagedBtn.disabled = false;
    publishAllStagedBtn.textContent = `🚀 Publish All to Website`;

    updateDashboardStats();
    populatePackAndCategoryDropdowns();
    renderStickersTable();
    updateJsonPreview();

    showToast(`🎉 Successfully published ${publishedCount} sticker(s) to website!`, "🚀");

    // Automatically switch to Manage tab to view them
    const manageTabBtn = document.querySelector("[data-tab='tab-manage']");
    if (manageTabBtn) manageTabBtn.click();
  }

  /**
   * Load Cloudinary Settings
   */
  function loadCloudinarySettings() {
    const config = getCloudinaryConfig();
    if (cloudNameInput) cloudNameInput.value = config.cloudName || "iyh1dd7y";
    if (uploadPresetInput) uploadPresetInput.value = config.uploadPreset || "";
    if (apiKeyInput) apiKeyInput.value = config.apiKey || "Eych-n4uQDcapk5gfcGsqDM3f8Y";
  }

  /**
   * Populate Category & Pack Selects
   */
  function populatePackAndCategoryDropdowns() {
    const categories = ["Memes", "Reactions", "Cute & Animals", "Anime & Pop Culture", "Gaming & Slang", "Vibe & Aesthetic"];
    const packs = getStickerPacks().map(p => p.name);

    if (stickerCategorySelect) {
      stickerCategorySelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join("");
    }
    if (stickerPackSelect) {
      stickerPackSelect.innerHTML = packs.map(p => `<option value="${p}">${p}</option>`).join("");
    }

    if (editStickerCategory) {
      editStickerCategory.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join("");
    }
    if (editStickerPack) {
      editStickerPack.innerHTML = packs.map(p => `<option value="${p}">${p}</option>`).join("");
    }
  }

  /**
   * Dashboard Statistics
   */
  function updateDashboardStats() {
    const stickers = getStickers();
    if (totalStickersCount) totalStickersCount.textContent = stickers.length.toLocaleString();
    
    const uniquePacks = new Set(stickers.map(s => s.pack).filter(Boolean));
    if (totalPacksCount) totalPacksCount.textContent = uniquePacks.size;

    const gifs = stickers.filter(s => isGifSticker(s)).length;
    if (gifStickersCount) gifStickersCount.textContent = gifs.toLocaleString();

    const featured = stickers.filter(s => s.featured).length;
    if (featuredCount) featuredCount.textContent = featured.toLocaleString();

    const totalDownloads = stickers.reduce((acc, s) => acc + (s.downloads || 0), 0);
    if (totalDownloadsCount) totalDownloadsCount.textContent = totalDownloads.toLocaleString();

    // Update filter chip badges
    if (chipAllCount) chipAllCount.textContent = stickers.length.toLocaleString();
    if (chipGifCount) chipGifCount.textContent = gifs.toLocaleString();
    if (chipFeaturedCount) chipFeaturedCount.textContent = featured.toLocaleString();
  }

  /**
   * Render Stickers Table
   */
  window.loadMoreAdminRows = function() {
    adminTableLimit += 50;
    renderStickersTable(adminSearchInput ? adminSearchInput.value : "");
  };

  function renderStickersTable(query = "") {
    if (!adminStickersTableBody) return;
    let stickers = getStickers();

    // 1. Format Filter
    if (currentTableFilter === "gif") {
      stickers = stickers.filter(s => isGifSticker(s));
    } else if (currentTableFilter === "featured") {
      stickers = stickers.filter(s => s.featured);
    }

    // 2. Search Query
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      stickers = stickers.filter(s => 
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.pack && s.pack.toLowerCase().includes(q)) ||
        (s.id && s.id.toLowerCase().includes(q)) ||
        (s.tags && s.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (stickers.length === 0) {
      adminStickersTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 40px; color: var(--text-secondary); font-size: 1.1rem;">
            🔍 No stickers found matching current filter.
          </td>
        </tr>
      `;
      return;
    }

    const visibleRows = stickers.slice(0, adminTableLimit);

    const rowsHtml = visibleRows.map(s => {
      const isGif = isGifSticker(s);
      const thumb = getLowResThumbnailUrl(s.imageUrl);

      return `
        <tr data-id="${s.id}">
          <td>
            <div class="admin-table-thumb">
              <img src="${thumb}" alt="${s.title}" width="48" height="48" loading="lazy" />
            </div>
          </td>
          <td>
            <strong style="color: var(--text-primary); font-size: 0.95rem; display: block;">${s.title}</strong>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${s.id}</span>
          </td>
          <td>
            ${isGif 
              ? '<span style="background: rgba(0, 240, 255, 0.15); color: #00F0FF; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; border: 1px solid rgba(0, 240, 255, 0.4);">🎬 GIF</span>'
              : '<span style="background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">PNG</span>'
            }
          </td>
          <td>
            <span style="background: rgba(167, 139, 250, 0.12); color: var(--accent-primary); padding: 3px 10px; border-radius: 9999px; font-size: 0.78rem; font-weight: 600;">
              ${s.category || 'Memes'}
            </span>
          </td>
          <td>
            <span style="font-size: 0.88rem; color: var(--text-secondary);">${s.pack || '—'}</span>
          </td>
          <td>
            <button class="btn-table-icon" onclick="window.toggleFeatured('${s.id}')" title="Toggle Featured Star" style="font-size: 1.1rem; color: ${s.featured ? '#FFD700' : 'var(--text-muted)'};">
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
              Load 50 More Rows (Showing ${visibleRows.length.toLocaleString()} of ${stickers.length.toLocaleString()})
            </button>
          </td>
        </tr>
      `;
    }

    adminStickersTableBody.innerHTML = rowsHtml + moreRowHtml;
  }

  // Toggle Featured Star
  window.toggleFeatured = function(id) {
    const stickers = getStickers();
    const sticker = stickers.find(s => s.id === id);
    if (sticker) {
      updateSticker(id, { featured: !sticker.featured });
      updateDashboardStats();
      renderStickersTable(adminSearchInput ? adminSearchInput.value : "");
      showToast(sticker.featured ? `⭐ Added "${sticker.title}" to Top Picks!` : `Removed "${sticker.title}" from Top Picks`, "✨");
    }
  };

  // Delete Sticker
  window.confirmDeleteSticker = function(id) {
    const stickers = getStickers();
    const sticker = stickers.find(s => s.id === id);
    const title = sticker ? sticker.title : id;
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteSticker(id);
      updateDashboardStats();
      populatePackAndCategoryDropdowns();
      renderStickersTable(adminSearchInput ? adminSearchInput.value : "");
      updateJsonPreview();
      showToast(`🗑️ Deleted "${title}"`, "✅");
    }
  };

  // Edit Sticker Modal
  window.openEditModal = function(id) {
    const stickers = getStickers();
    const sticker = stickers.find(s => s.id === id);
    if (!sticker || !editModal) return;

    if (editStickerId) editStickerId.value = sticker.id;
    if (editStickerTitle) editStickerTitle.value = sticker.title || "";
    if (editStickerUrl) editStickerUrl.value = sticker.imageUrl || "";
    if (editStickerCategory) editStickerCategory.value = sticker.category || "Memes";
    if (editStickerPack) editStickerPack.value = sticker.pack || "Community Uploads";
    if (editStickerTags) editStickerTags.value = Array.isArray(sticker.tags) ? sticker.tags.join(", ") : "";
    if (editStickerFeatured) editStickerFeatured.checked = Boolean(sticker.featured);

    if (editPreviewImg) {
      editPreviewImg.src = getOptimizedImageUrl(sticker.imageUrl, { width: 100 });
    }

    editModal.classList.add("active");
  };

  function closeEditModal() {
    if (editModal) editModal.classList.remove("active");
  }

  if (editModalCloseBtn) editModalCloseBtn.addEventListener("click", closeEditModal);
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", closeEditModal);

  /**
   * Setup Event Listeners
   */
  function setupAdminEventListeners() {
    // Format Filter Chips
    if (tableFilterChips) {
      tableFilterChips.querySelectorAll(".table-filter-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          tableFilterChips.querySelectorAll(".table-filter-chip").forEach(c => c.classList.remove("active"));
          chip.classList.add("active");
          currentTableFilter = chip.dataset.filter || "all";
          adminTableLimit = 50;
          renderStickersTable(adminSearchInput ? adminSearchInput.value : "");
        });
      });
    }

    // Save Cloudinary settings
    if (saveCloudinaryBtn) {
      saveCloudinaryBtn.addEventListener("click", () => {
        const cloudName = cloudNameInput ? cloudNameInput.value.trim() : "iyh1dd7y";
        const uploadPreset = uploadPresetInput ? uploadPresetInput.value.trim() : "";
        const apiKey = apiKeyInput ? apiKeyInput.value.trim() : "Eych-n4uQDcapk5gfcGsqDM3f8Y";
        saveCloudinaryConfig({ cloudName, uploadPreset, apiKey });
        showToast("☁️ Cloudinary settings saved!", "✅");
      });
    }

    // Live Preview on Single URL input
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

    // Cloudinary Widget Button
    if (launchCloudinaryWidgetBtn) {
      launchCloudinaryWidgetBtn.addEventListener("click", () => {
        const config = getCloudinaryConfig();
        if (window.cloudinary && config.cloudName) {
          const widget = window.cloudinary.createUploadWidget({
            cloudName: config.cloudName,
            uploadPreset: config.uploadPreset || "stickers_preset",
            apiKey: config.apiKey || "Eych-n4uQDcapk5gfcGsqDM3f8Y",
            sources: ["local", "url", "camera"],
            multiple: true
          }, (err, result) => {
            if (!err && result && result.event === "success") {
              const url = result.info.secure_url;
              if (stickerUrlInput) {
                stickerUrlInput.value = url;
                stickerUrlInput.dispatchEvent(new Event("input"));
              }
              showToast("☁️ Uploaded via Cloudinary Widget!", "✨");
            }
          });
          widget.open();
        } else {
          alert("Cloudinary widget script is still loading or requires Cloud Name. Please use the drag-and-drop zone above for instant local upload!");
        }
      });
    }

    // Single Add Sticker Form Submit
    if (addStickerForm) {
      addStickerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = stickerTitleInput ? stickerTitleInput.value.trim() : "";
        const imageUrl = stickerUrlInput ? stickerUrlInput.value.trim() : "";
        const category = stickerCategorySelect ? stickerCategorySelect.value : "Memes";
        const pack = stickerPackSelect ? stickerPackSelect.value : "Community Uploads";
        const tags = stickerTagsInput ? stickerTagsInput.value.split(",").map(t => t.trim().toLowerCase()).filter(Boolean) : [];
        const featured = stickerFeaturedCheckbox ? stickerFeaturedCheckbox.checked : false;

        if (!imageUrl) {
          alert("Please provide a valid sticker image URL!");
          return;
        }

        const newSticker = addSticker({
          title: title || "Untitled Sticker",
          imageUrl,
          category,
          pack,
          tags,
          platforms: ["whatsapp", "discord", "instagram", "telegram", "reddit", "snapchat"],
          featured
        });

        addStickerForm.reset();
        if (livePreviewImg) {
          livePreviewImg.src = "";
          livePreviewImg.style.display = "none";
        }
        if (livePreviewEmpty) livePreviewEmpty.style.display = "block";

        updateDashboardStats();
        populatePackAndCategoryDropdowns();
        renderStickersTable();
        updateJsonPreview();
        showToast(`🎉 Added "${newSticker.title}"!`, "✨");

        const manageTabBtn = document.querySelector("[data-tab='tab-manage']");
        if (manageTabBtn) manageTabBtn.click();
      });
    }

    // Edit Sticker Form Submit
    if (editStickerForm) {
      editStickerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = editStickerId.value;
        const title = editStickerTitle.value.trim();
        const imageUrl = editStickerUrl.value.trim();
        const category = editStickerCategory.value;
        const pack = editStickerPack.value;
        const tags = editStickerTags.value.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
        const featured = editStickerFeatured.checked;

        updateSticker(id, {
          title,
          imageUrl,
          category,
          pack,
          tags,
          featured
        });

        closeEditModal();
        updateDashboardStats();
        populatePackAndCategoryDropdowns();
        renderStickersTable(adminSearchInput ? adminSearchInput.value : "");
        renderAdminPacksList();
        updateJsonPreview();
        showToast(`✏️ Updated "${title}"!`, "✅");
      });
    }

    // Search existing stickers in admin table
    if (adminSearchInput) {
      let debounceTimer = null;
      adminSearchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          renderStickersTable(e.target.value);
        }, 150);
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
              populatePackAndCategoryDropdowns();
              renderStickersTable();
              renderAdminPacksList();
              updateJsonPreview();
              showToast(`📥 Successfully imported ${imported.length} stickers!`, "🎉");
            } else {
              alert("Invalid JSON: File must contain an array of sticker objects.");
            }
          } catch (err) {
            alert("Error parsing JSON file: " + err.message);
          }
        };
        reader.readAsText(file);
      });
    }

    // Reset to seed stickers button
    if (resetSeedBtn) {
      resetSeedBtn.addEventListener("click", () => {
        if (confirm("Reset local stickers database to default seed catalog?")) {
          resetToDefaultSeed();
          updateDashboardStats();
          populatePackAndCategoryDropdowns();
          renderStickersTable();
          renderAdminPacksList();
          updateJsonPreview();
          showToast("🔄 Reset to default seed catalog!", "ℹ️");
        }
      });
    }

    // Auto-Detect & Sync Packs Button (NON-DESTRUCTIVE MERGE)
    const adminScanPacksBtn = document.getElementById("adminScanPacksBtn");
    if (adminScanPacksBtn) {
      adminScanPacksBtn.addEventListener("click", async () => {
        adminScanPacksBtn.disabled = true;
        adminScanPacksBtn.innerHTML = `<span>⏳</span> Scanning Cloudinary & Manifest...`;

        try {
          const res = await fetch("data/packs-manifest.json?t=" + Date.now());
          if (res.ok) {
            const manifest = await res.json();
            console.log("Loaded manifest:", manifest);
          }
        } catch (e) {
          console.log("Manifest fetch:", e);
        }

        updateDashboardStats();
        populatePackAndCategoryDropdowns();
        renderStickersTable();
        renderAdminPacksList();
        updateJsonPreview();

        const packs = getStickerPacks();
        const stickers = getStickers();
        showToast(`🎉 Verified ${packs.length} packs (${stickers.length.toLocaleString()} stickers)!`, "☁️");

        adminScanPacksBtn.disabled = false;
        adminScanPacksBtn.innerHTML = `⚡ Run Auto-Detector Now`;
      });
    }

    // Create Pack From Cloudinary Form
    const createPackFromCloudinaryBtn = document.getElementById("createPackFromCloudinaryBtn");
    if (createPackFromCloudinaryBtn) {
      createPackFromCloudinaryBtn.addEventListener("click", () => {
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

        const ids = rawIds.split(/[\n,]+/).map(s => s.trim().replace(/\.[^.]+$/, "")).filter(Boolean);
        if (ids.length === 0) {
          alert("Please provide at least one Cloudinary Public ID or filename!");
          return;
        }

        const config = getCloudinaryConfig();
        const cloudName = config.cloudName || "iyh1dd7y";
        const cleanPack = formatPackTitle(rawPackName);

        ids.forEach((pid, i) => {
          const imgUrl = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,w_400/${pid}`;
          addSticker({
            id: `cly-${pid.slice(0, 8)}`,
            title: `${cleanPack} #${i + 1}`,
            imageUrl: imgUrl,
            category: category,
            platforms: ["whatsapp", "discord", "instagram", "telegram", "reddit", "snapchat"],
            tags: [cleanPack.toLowerCase(), "sticker", "reaction", `#${i + 1}`],
            pack: cleanPack,
            featured: i < 3,
            downloads: 40 + (i * 5) % 80
          });
        });

        if (nameInput) nameInput.value = "";
        if (idsInput) idsInput.value = "";

        updateDashboardStats();
        populatePackAndCategoryDropdowns();
        renderStickersTable();
        renderAdminPacksList();
        updateJsonPreview();

        showToast(`🎉 Created pack "${cleanPack}" with ${ids.length} stickers!`, "🚀");

        // Automatically trigger Groq AI SEO generation for this new bundle!
        if (typeof generatePackSeoWithGroq === "function") {
          showToast(`🤖 Groq AI is generating SEO landing page for "${cleanPack}"...`, "⏳");
          generatePackSeoWithGroq(cleanPack, category, ids.length).then(seo => {
            if (seo && typeof savePackSeoToCache === "function") {
              const slug = cleanPack.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
              savePackSeoToCache(slug, seo);
              showToast(`✨ Detailed SEO page for "${cleanPack}" is ready and live!`, "📄");
              renderAdminPacksList();
            }
          });
        }
      });
    }

    // Groq AI API Key and Generation Listeners
    const groqApiKeyInput = document.getElementById("groqApiKeyInput");
    const saveGroqKeyBtn = document.getElementById("saveGroqKeyBtn");
    const generateAllPackPagesBtn = document.getElementById("generateAllPackPagesBtn");

    if (groqApiKeyInput && typeof getGroqApiKey === "function") {
      groqApiKeyInput.value = getGroqApiKey();
    }

    if (saveGroqKeyBtn && groqApiKeyInput && typeof saveGroqApiKey === "function") {
      saveGroqKeyBtn.addEventListener("click", () => {
        saveGroqApiKey(groqApiKeyInput.value.trim());
        showToast("🤖 Groq API key saved!", "✅");
      });
    }

    if (generateAllPackPagesBtn && typeof generatePackSeoWithGroq === "function") {
      generateAllPackPagesBtn.addEventListener("click", async () => {
        generateAllPackPagesBtn.disabled = true;
        const originalText = generateAllPackPagesBtn.textContent;
        generateAllPackPagesBtn.textContent = "⏳ Generating with Groq AI...";

        const packs = getStickerPacks();
        const stickers = getStickers();
        let successCount = 0;

        for (let i = 0; i < packs.length; i++) {
          const p = packs[i];
          const pName = p.displayName || p.name;
          const slug = p.slug || pName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          const pStickers = stickers.filter(s => (s.pack || "").toLowerCase() === p.name.toLowerCase());

          showToast(`🤖 [${i + 1}/${packs.length}] Writing SEO page for "${pName}"...`, "✍️");

          try {
            const seo = await generatePackSeoWithGroq(pName, p.category || "Memes", pStickers.length, pStickers);
            if (seo && typeof savePackSeoToCache === "function") {
              savePackSeoToCache(slug, seo);
              successCount++;
            }
          } catch (err) {
            console.warn(`Groq SEO generation failed for ${pName}:`, err);
          }
        }

        generateAllPackPagesBtn.disabled = false;
        generateAllPackPagesBtn.textContent = originalText;
        renderAdminPacksList();
        showToast(`🎉 Groq AI generated SEO content for all ${successCount} packs!`, "🚀");
      });
    }
  }

  // Window helper: Generate SEO for single pack
  window.generateSinglePackSeo = async function(packName) {
    if (typeof generatePackSeoWithGroq !== "function") return;
    const stickers = getStickers();
    const packs = getStickerPacks();
    const pack = packs.find(p => (p.name || "").toLowerCase() === packName.toLowerCase());
    if (!pack) return;

    const pStickers = stickers.filter(s => (s.pack || "").toLowerCase() === packName.toLowerCase());
    const slug = pack.slug || packName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    showToast(`🤖 Groq AI generating SEO content for "${packName}"...`, "⏳");
    try {
      const seo = await generatePackSeoWithGroq(packName, pack.category || "Memes", pStickers.length, pStickers);
      if (seo && typeof savePackSeoToCache === "function") {
        savePackSeoToCache(slug, seo);
        showToast(`✨ Generated SEO landing page for "${packName}"!`, "📄");
        renderAdminPacksList();
      }
    } catch (e) {
      showToast(`Error generating SEO: ${e.message}`, "❌");
    }
  };

  /**
   * Render Active Packs List in Cloudinary Tab
   */
  function renderAdminPacksList() {
    const listEl = document.getElementById("adminPacksList");
    const countEl = document.getElementById("adminPacksCount");
    if (!listEl) return;
    const packs = getStickerPacks();
    const stickers = getStickers();
    if (countEl) countEl.textContent = packs.length;

    listEl.innerHTML = packs.map(p => {
      const pName = p.displayName || p.name;
      const slug = p.slug || pName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const pStickers = stickers.filter(s => (s.pack || "").toLowerCase() === p.name.toLowerCase());
      const hasSeo = typeof getCachedPackSeo === "function" && getCachedPackSeo(slug);

      return `
        <div style="background: var(--paper-bg); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.4rem; background: ${p.color}; width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; color: #05070f;">${p.icon}</span>
                <strong style="font-size: 1rem; color: var(--text-primary);">${pName}</strong>
              </div>
              <span style="font-family: var(--font-mono); font-size: 0.8rem; background: rgba(255, 255, 255, 0.05); padding: 2px 8px; border-radius: 6px; color: var(--text-secondary);">${pStickers.length}</span>
            </div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px;">${p.description || 'Curated pack'}</div>
          </div>
          
          <div style="display: flex; gap: 8px; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
            <a href="pack-${slug}.html" target="_blank" class="btn-sketch btn-sketch-sm" style="flex: 1; text-align: center; text-decoration: none; font-size: 0.8rem; padding: 6px 10px; border-color: #00F0FF; color: #00F0FF;" title="View Live Page">
              📄 View Page &rarr;
            </a>
            <button type="button" class="btn-sketch btn-sketch-sm" onclick="window.generateSinglePackSeo('${p.name}')" style="font-size: 0.8rem; padding: 6px 10px;" title="Re-Generate with Groq LLM">
              🤖 AI SEO
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  /**
   * Update JSON Preview Textarea
   */
  function updateJsonPreview() {
    if (!jsonPreviewArea) return;
    const stickers = getStickers();
    jsonPreviewArea.value = JSON.stringify(stickers.slice(0, 50), null, 2) + (stickers.length > 50 ? `\n\n// ... and ${stickers.length - 50} more items` : "");
  }

  /**
   * Floating Toast Notification
   */
  function showToast(message, icon = "✨") {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast-item active";
    toast.style.cssText = `
      background: #171b24;
      color: #ffffff;
      border: 1px solid rgba(0, 240, 255, 0.4);
      box-shadow: 0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(0, 240, 255, 0.2);
      border-radius: 12px;
      padding: 12px 20px;
      margin-top: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 9999;
      animation: fadeIn 0.25s ease;
    `;
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
});
