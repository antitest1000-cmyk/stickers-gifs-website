/**
 * STICKERPENCIL - CLIENT APPLICATION CONTROLLER
 * Handles search, platform filtering, clipboard copy, modal previews, tape accents, and phone dock.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const stickersGrid = document.getElementById("stickersGrid");
  const searchInput = document.getElementById("searchInput");
  const searchClearBtn = document.getElementById("searchClearBtn");
  const platformButtons = document.querySelectorAll(".platform-pill-btn");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortFilter = document.getElementById("sortFilter");
  const stickerCountBadge = document.getElementById("stickerCountBadge");
  const emptyState = document.getElementById("emptyState");

  // Modal Elements
  const modalBackdrop = document.getElementById("stickerModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalImg = document.getElementById("modalImg");
  const modalTitle = document.getElementById("modalTitle");
  const modalCategory = document.getElementById("modalCategory");
  const modalPack = document.getElementById("modalPack");
  const modalTags = document.getElementById("modalTags");
  const modalCopyBtn = document.getElementById("modalCopyBtn");
  const modalDownloadBtn = document.getElementById("modalDownloadBtn");
  const modalCopyLinkBtn = document.getElementById("modalCopyLinkBtn");
  const modalPlatformGuides = document.getElementById("modalPlatformGuides");

  // Nav & Theme Elements
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const navLinks = document.getElementById("navLinks");
  const modeToggleBtn = document.getElementById("modeToggleBtn");
  const toastContainer = document.getElementById("toastContainer");

  // GIPHY Iconic Vibrant Pop-Art Skeleton Colors
  const GIPHY_COLORS = [
    '#00ccff', // neon cyan
    '#fff35c', // bright lemon yellow
    '#9933ff', // electric purple
    '#00ff99', // neon green
    '#ff2e83', // hot pink
    '#ff6600'  // electric orange
  ];

  const CATEGORY_THEMES = {
    "Cute & Animals": { 
      bg: "linear-gradient(135deg, rgba(254, 240, 138, 0.35), rgba(250, 204, 21, 0.2))", 
      border: "#facc15", 
      icon: "🐱", 
      hint: "Cute cats, doggos & happy babies",
      glow: "rgba(250, 204, 21, 0.4)",
      textColor: "#fef08a"
    },
    "Memes & Reactions": { 
      bg: "linear-gradient(135deg, rgba(255, 46, 131, 0.35), rgba(255, 0, 122, 0.2))", 
      border: "#ff007a", 
      icon: "🔥", 
      hint: "Viral desi banter & savage punchlines",
      glow: "rgba(255, 0, 122, 0.4)",
      textColor: "#ff70a6"
    },
    "Vibe & Aesthetic": { 
      bg: "linear-gradient(135deg, rgba(0, 240, 255, 0.35), rgba(56, 189, 248, 0.2))", 
      border: "#00f0ff", 
      icon: "✨", 
      hint: "Pastel doodles, anime & lo-fi vibes",
      glow: "rgba(0, 240, 255, 0.4)",
      textColor: "#67e8f9"
    },
    "Memes": { 
      bg: "linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(147, 51, 234, 0.2))", 
      border: "#a855f7", 
      icon: "😂", 
      hint: "Peak internet brainrot & funny shitposts",
      glow: "rgba(168, 85, 247, 0.4)",
      textColor: "#d8b4fe"
    },
    "Trending & Aesthetic": { 
      bg: "linear-gradient(135deg, rgba(52, 211, 153, 0.35), rgba(16, 185, 129, 0.2))", 
      border: "#34d399", 
      icon: "⚡", 
      hint: "Hot viral drops & trending icons",
      glow: "rgba(52, 211, 153, 0.4)",
      textColor: "#6ee7b7"
    }
  };

  // State
  let allStickers = getStickers();
  let currentPlatform = "all";
  let currentCategory = "all";
  let currentSort = "popular";
  let currentSearchQuery = "";
  let currentContentType = "all"; // 'all' | 'gif'
  let activeModalSticker = null;
  const INITIAL_BATCH = 24;
  const APPEND_BATCH = 20;
  let visibleCount = INITIAL_BATCH;
  let scrollObserver = null;
  let imageObserver = null;
  let isAppending = false;

  // Initialize
  initApp();

  function initApp() {
    readUrlParams();
    setupCategoriesDropdown();
    setupCustomDropdowns();
    updatePlatformCounts();
    renderStickers(true);
    setupEventListeners();
    setupTheme();
    renderHomepagePacksPreview();
  }

  /**
   * Render preloaded skeleton placeholders before stickers load (Tight GIPHY Layout)
   */
  function showInitialSkeletons(count = 24) {
    if (!stickersGrid) return;
    const heights = [260, 350, 210, 310, 270];
    const skeletonsHtml = Array.from({ length: count }).map((_, i) => {
      const h = heights[i % heights.length];
      const color = GIPHY_COLORS[i % GIPHY_COLORS.length];
      return `
        <div class="sticker-card skeleton-card" aria-hidden="true">
          <div class="sticker-preview-box" style="height: ${h}px;">
            <div class="sticker-skeleton" style="--card-color: ${color};">
              <div class="skeleton-shimmer"></div>
            </div>
          </div>
        </div>
      `;
    }).join("");
    stickersGrid.innerHTML = skeletonsHtml;
  }

  function renderHomepagePacksPreview() {
    const previewContainer = document.querySelector(".banner-packs-preview");
    if (!previewContainer || typeof getStickerPacks !== "function") return;
    const packs = getStickerPacks();
    previewContainer.innerHTML = packs.slice(0, 4).map(p => {
      const pStickers = allStickers.filter(s => (s.pack || "").toLowerCase() === p.name.toLowerCase());
      return `
        <a href="packs.html" class="pack-mini-card">
          <span class="pack-mini-icon">${p.icon}</span>
          <div>
            <div class="pack-mini-name">${p.displayName || p.name}</div>
            <div class="pack-mini-count">${pStickers.length || p.count || '100+'} Stickers • WhatsApp / Discord</div>
          </div>
        </a>
      `;
    }).join("");
  }

  /**
   * Parse query parameters on page load (?pack=..., ?platform=..., ?q=...)
   */
  function readUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const paramPack = params.get("pack");
    const paramPlatform = params.get("platform");
    const paramCategory = params.get("category");
    const paramQuery = params.get("q") || params.get("search");

    if (paramPlatform && ["whatsapp", "discord", "instagram", "snapchat", "reddit", "telegram"].includes(paramPlatform)) {
      currentPlatform = paramPlatform;
      platformButtons.forEach(b => {
        if (b.dataset.platform === paramPlatform) b.classList.add("active");
        else b.classList.remove("active");
      });
    }

    if (paramCategory) {
      currentCategory = paramCategory;
    }

    const paramSticker = params.get("sticker");
    if (paramSticker) {
      setTimeout(() => {
        if (typeof window.openStickerModal === "function") {
          window.openStickerModal(paramSticker);
        }
      }, 200);
    }

    if (paramPack) {
      currentSearchQuery = paramPack;
      if (searchInput) {
        searchInput.value = paramPack;
        if (searchClearBtn) searchClearBtn.style.display = "flex";
      }
    } else if (paramQuery) {
      currentSearchQuery = paramQuery;
      if (searchInput) {
        searchInput.value = paramQuery;
        if (searchClearBtn) searchClearBtn.style.display = "flex";
      }
    }
  }

  /**
   * Helper: Category Emojis for Pop-Art Visual Identity
   */
  function getCategoryEmoji(cat) {
    if (!cat) return "🎨";
    const c = cat.toLowerCase();
    if (c.includes("cute") || c.includes("animal") || c.includes("cat") || c.includes("dog")) return "🐱";
    if (c.includes("meme") && c.includes("reaction")) return "🔥";
    if (c.includes("meme")) return "😂";
    if (c.includes("vibe") || c.includes("aesthetic")) return "✨";
    if (c.includes("trending")) return "⚡";
    if (c.includes("desi") || c.includes("hinglish")) return "🌶️";
    if (c.includes("kid") || c.includes("baby")) return "👶";
    return "🏷️";
  }

  /**
   * Populate category filter options dynamically from data into sleek custom dropdown
   */
  function setupCategoriesDropdown() {
    const categoryPanel = document.getElementById("categoryDropdownPanel");
    const categories = new Set();
    allStickers.forEach(s => {
      if (s.category) categories.add(s.category);
    });

    if (categoryFilter && categoryFilter.tagName === "SELECT") {
      categoryFilter.innerHTML = '<option value="all">🎨 All Categories</option>';
      categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = `${getCategoryEmoji(cat)} ${cat}`;
        categoryFilter.appendChild(opt);
      });
    }

    if (categoryPanel) {
      let html = `
        <button type="button" class="custom-dropdown-item ${currentCategory === 'all' ? 'active' : ''}" data-value="all" role="option" aria-selected="${currentCategory === 'all'}">
          <span class="item-icon-bubble" style="background: linear-gradient(135deg, rgba(255, 0, 122, 0.35), rgba(0, 240, 255, 0.35)); border: 1px solid #ff007a; box-shadow: 0 0 12px rgba(255, 0, 122, 0.45);">🎨</span>
          <div class="item-text-wrap">
            <span class="item-title" style="color: #ffffff;">All Categories</span>
            <span class="item-hint">Show all sticker themes &amp; moods</span>
          </div>
          <span class="item-check">✓</span>
        </button>
      `;

      categories.forEach(cat => {
        const theme = CATEGORY_THEMES[cat] || {
          bg: "rgba(255, 255, 255, 0.12)",
          border: "rgba(255, 255, 255, 0.3)",
          icon: getCategoryEmoji(cat),
          hint: "Themed sticker collection",
          glow: "rgba(255, 255, 255, 0.2)",
          textColor: "#ffffff"
        };
        const isActive = currentCategory === cat;
        html += `
          <button type="button" class="custom-dropdown-item ${isActive ? 'active' : ''}" data-value="${escapeHtml(cat)}" role="option" aria-selected="${isActive}">
            <span class="item-icon-bubble" style="background: ${theme.bg}; border: 1px solid ${theme.border}; box-shadow: 0 0 12px ${theme.glow};">${theme.icon}</span>
            <div class="item-text-wrap">
              <span class="item-title" style="color: ${theme.textColor || '#ffffff'};">${escapeHtml(cat)}</span>
              <span class="item-hint">${theme.hint}</span>
            </div>
            <span class="item-check" style="color: ${theme.border};">✓</span>
          </button>
        `;
      });
      categoryPanel.innerHTML = html;
    }
  }

  /**
   * Setup interactive custom glassmorphism dropdowns (Pop-art, fully touch-friendly, zero native OS blue select)
   */
  function setupCustomDropdowns() {
    const categoryWrap = document.getElementById("categoryDropdownWrap");
    const categoryBtn = document.getElementById("categoryDropdownBtn");
    const categoryPanel = document.getElementById("categoryDropdownPanel");
    const categoryValue = document.getElementById("categoryDropdownValue");

    const sortWrap = document.getElementById("sortDropdownWrap");
    const sortBtn = document.getElementById("sortDropdownBtn");
    const sortPanel = document.getElementById("sortDropdownPanel");
    const sortValue = document.getElementById("sortDropdownValue");

    function closeAllDropdowns() {
      if (categoryWrap) {
        categoryWrap.classList.remove("open");
        categoryBtn?.setAttribute("aria-expanded", "false");
      }
      if (sortWrap) {
        sortWrap.classList.remove("open");
        sortBtn?.setAttribute("aria-expanded", "false");
      }
    }

    // Toggle Category Dropdown
    if (categoryBtn && categoryWrap) {
      categoryBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = categoryWrap.classList.contains("open");
        closeAllDropdowns();
        if (!isOpen) {
          categoryWrap.classList.add("open");
          categoryBtn.setAttribute("aria-expanded", "true");
        }
      });
    }

    // Category Item Select
    if (categoryPanel) {
      categoryPanel.addEventListener("click", (e) => {
        const item = e.target.closest(".custom-dropdown-item");
        if (!item) return;
        e.stopPropagation();
        const val = item.getAttribute("data-value");
        currentCategory = val;
        if (categoryFilter) categoryFilter.value = val;

        categoryPanel.querySelectorAll(".custom-dropdown-item").forEach(el => {
          const isSelected = el === item;
          el.classList.toggle("active", isSelected);
          el.setAttribute("aria-selected", isSelected);
        });

        const icon = item.querySelector(".item-icon-bubble")?.textContent || "🎨";
        const title = item.querySelector(".item-title")?.textContent || "All Categories";
        if (categoryValue) {
          categoryValue.innerHTML = `
            <span class="dropdown-icon-pill">${icon}</span>
            <span class="dropdown-label-text">${escapeHtml(title)}</span>
          `;
        }

        closeAllDropdowns();
        renderStickers(true);
      });
    }

    // Toggle Sort Dropdown
    if (sortBtn && sortWrap) {
      sortBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = sortWrap.classList.contains("open");
        closeAllDropdowns();
        if (!isOpen) {
          sortWrap.classList.add("open");
          sortBtn.setAttribute("aria-expanded", "true");
        }
      });
    }

    // Sort Item Select
    if (sortPanel) {
      sortPanel.addEventListener("click", (e) => {
        const item = e.target.closest(".custom-dropdown-item");
        if (!item) return;
        e.stopPropagation();
        const val = item.getAttribute("data-value");
        currentSort = val;
        if (sortFilter) sortFilter.value = val;

        sortPanel.querySelectorAll(".custom-dropdown-item").forEach(el => {
          const isSelected = el === item;
          el.classList.toggle("active", isSelected);
          el.setAttribute("aria-selected", isSelected);
        });

        const icon = item.querySelector(".item-icon-bubble")?.textContent || "🔥";
        const title = item.querySelector(".item-title")?.textContent || "Most Popular";
        if (sortValue) {
          sortValue.innerHTML = `
            <span class="dropdown-icon-pill">${icon}</span>
            <span class="dropdown-label-text">${escapeHtml(title)}</span>
          `;
        }

        closeAllDropdowns();
        renderStickers(true);
      });
    }

    // Global Click Outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".custom-dropdown")) {
        closeAllDropdowns();
      }
    });

    // Escape Key Handler
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAllDropdowns();
      }
    });
  }

  /**
   * Update the badge counter on each platform pill
   */
  function updatePlatformCounts() {
    platformButtons.forEach(btn => {
      const platform = btn.dataset.platform;
      const countSpan = btn.querySelector(".platform-badge-count");
      if (!countSpan) return;

      if (platform === "all") {
        countSpan.textContent = allStickers.length;
      } else {
        const count = allStickers.filter(s => s.platforms && s.platforms.includes(platform)).length;
        countSpan.textContent = count;
      }
    });
  }

  /**
   * Filter and Sort stickers based on current state
   */
  function getFilteredStickers() {
    let filtered = [...allStickers];

    // 0. Content Type Filter (Stickers vs GIFs)
    if (currentContentType === "gif") {
      filtered = filtered.filter(s => (typeof isGifSticker === "function" ? isGifSticker(s) : false));
    }

    // 1. Platform Filter
    if (currentPlatform !== "all") {
      filtered = filtered.filter(s => s.platforms && s.platforms.includes(currentPlatform));
    }

    // 2. Category Filter
    if (currentCategory !== "all") {
      filtered = filtered.filter(s => s.category === currentCategory);
    }

    // 3. Search Query (Title, Category, Tags, Pack, or 'gif')
    if (currentSearchQuery.trim()) {
      const q = currentSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(s => {
        const titleMatch = s.title && s.title.toLowerCase().includes(q);
        const catMatch = s.category && s.category.toLowerCase().includes(q);
        const packMatch = s.pack && s.pack.toLowerCase().includes(q);
        const tagsMatch = s.tags && s.tags.some(t => t.toLowerCase().includes(q));
        const gifMatch = (q === "gif" || q === "gifs" || q === "animated") && (typeof isGifSticker === "function" ? isGifSticker(s) : false);
        return titleMatch || catMatch || packMatch || tagsMatch || gifMatch;
      });
    }

    // 4. Sorting
    if (currentSort === "popular") {
      filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (currentSort === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (currentSort === "name") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }

  /**
   * Render sticker cards into the grid (Dynamic Smooth Batching)
   */
  function renderStickers(resetPaging = false) {
    if (!stickersGrid) return;
    if (resetPaging) {
      visibleCount = 48;
    }
    const items = getFilteredStickers();

    // No intrusive sticker number count badge
    if (stickerCountBadge) {
      stickerCountBadge.textContent = "";
      stickerCountBadge.style.display = "none";
    }

    // Dynamic GIPHY-Style Feed Heading
    const feedTitle = document.getElementById("feedTitle");
    if (feedTitle) {
      if (currentSearchQuery && currentSearchQuery.trim()) {
        feedTitle.innerHTML = `Explore <span class="search-term-cyan">${escapeHtml(currentSearchQuery.trim())}</span> Stickers`;
      } else if (currentPlatform && currentPlatform !== "all") {
        const platformLabels = {
          whatsapp: "WhatsApp",
          discord: "Discord",
          instagram: "Instagram",
          snapchat: "Snapchat",
          reddit: "Reddit",
          telegram: "Telegram"
        };
        feedTitle.innerHTML = `Explore <span class="search-term-cyan">${platformLabels[currentPlatform] || currentPlatform}</span> Stickers`;
      } else if (currentCategory && currentCategory !== "all") {
        feedTitle.innerHTML = `Explore <span class="search-term-cyan">${escapeHtml(currentCategory)}</span> Stickers`;
      } else {
        feedTitle.innerHTML = `Trending Now`;
      }
    }

    // Toggle Empty State
    if (items.length === 0) {
      stickersGrid.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    function getPackEmoji(packName) {
      if (!packName) return "✨";
      const p = packName.toLowerCase();
      if (p.includes("cat") || p.includes("billi")) return "🐱";
      if (p.includes("dog") || p.includes("doggo")) return "🐶";
      if (p.includes("desi") || p.includes("hinglish")) return "🔥";
      if (p.includes("kid") || p.includes("baby")) return "👶";
      if (p.includes("brainrot") || p.includes("goof")) return "🤪";
      if (p.includes("jolochip") || p.includes("spicy")) return "🌶️";
      if (p.includes("diva") || p.includes("queen")) return "💅";
      if (p.includes("pop") || p.includes("aesthetic")) return "✨";
      return "📦";
    }

    function buildCardHtml(sticker, index) {
      const cardColor = GIPHY_COLORS[index % GIPHY_COLORS.length];
      const isGif = typeof isGifSticker === "function" ? isGifSticker(sticker) : false;
      const lowResThumb = getLowResThumbnailUrl(sticker.imageUrl);
      const fullResUrl = getFullQualityImageUrl(sticker.imageUrl);
      const fallbackAttr = sticker.fallbackUrl ? `data-fallback="${sticker.fallbackUrl}" onerror="if(this.dataset.fallback && !this.dataset.fallbackApplied){this.dataset.fallbackApplied='1';this.src=this.dataset.fallback;}"` : '';
      const featuredBadgeHtml = sticker.featured ? `<div class="featured-badge">⭐ Top Pick</div>` : "";
      const gifBadgeHtml = isGif ? `<div class="pin-gif-badge"><span class="gif-pulse-dot"></span>GIF</div>` : "";
      const isEager = index < 12;
      const srcAttr = isEager
        ? `src="${lowResThumb}" fetchpriority="high"`
        : `src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 240'%3E%3C/svg%3E" data-src="${lowResThumb}" loading="lazy"`;

      const packEmoji = getPackEmoji(sticker.pack);
      const packName = sticker.pack || "Curated Pack";
      const platformBadge = isGif ? "GIF" : ((sticker.platforms && sticker.platforms.length)
        ? (sticker.platforms.includes("whatsapp") ? "WhatsApp" : sticker.platforms[0].charAt(0).toUpperCase() + sticker.platforms[0].slice(1))
        : "HD PNG");

      return `
        <article class="sticker-card ${isGif ? 'card-is-gif' : 'card-is-sticker'}" data-id="${sticker.id}" onclick="window.openStickerModal('${sticker.id}')" style="cursor: pointer;">
          ${featuredBadgeHtml}
          ${gifBadgeHtml}
          <div class="sticker-preview-box" title="Click to view details & download ${isGif ? 'GIF' : 'HD'}">
            <button type="button" class="pin-mobile-copy-btn" onclick="event.stopPropagation(); window.copyStickerImage('${sticker.id}', event)" title="${isGif ? '1-Click Copy GIF' : '1-Click Copy Sticker'}" aria-label="Copy sticker">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
            <div class="sticker-skeleton" style="--card-color: ${cardColor};">
              <div class="skeleton-shimmer"></div>
            </div>
            <img 
              ${srcAttr} 
              data-full-src="${fullResUrl}" 
              ${fallbackAttr} 
              alt="${sticker.title} sticker" 
              class="sticker-img" 
              decoding="async" 
              onload="this.classList.add('loaded'); const s = this.parentElement.querySelector('.sticker-skeleton'); if (s) s.classList.add('hidden');" 
              onerror="if(this.dataset.fallback && !this.dataset.fallbackApplied){this.dataset.fallbackApplied='1';this.src=this.dataset.fallback;}else{this.classList.add('loaded'); const s = this.parentElement.querySelector('.sticker-skeleton'); if (s) s.classList.add('hidden');}" 
            />
            <div class="pin-hover-overlay" onclick="event.stopPropagation()">
              <div class="pin-top-actions">
                <span class="pin-overlay-tag">${platformBadge}</span>
                <button class="pin-btn-copy" onclick="window.copyStickerImage('${sticker.id}', event)" title="${isGif ? '1-Click Copy Animated GIF' : '1-Click Copy Image'}">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <span>Copy</span>
                </button>
              </div>
              <div class="pin-bottom-bar">
                <div class="pin-overlay-details">
                  <span class="pin-overlay-title" title="${escapeHtml(sticker.title)}">${escapeHtml(sticker.title)}</span>
                  <span class="pin-overlay-pack">${packEmoji} ${escapeHtml(packName)}</span>
                </div>
                <div class="pin-bottom-actions">
                  <button class="pin-btn-icon" onclick="window.downloadSticker('${sticker.id}', event)" title="${isGif ? 'Download Animated GIF (.gif)' : 'Download Transparent PNG'}">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </button>
                  <a href="sticker-maker.html?sticker=${encodeURIComponent(sticker.id)}" class="pin-btn-icon" title="Animate & Edit in Studio" onclick="event.stopPropagation()">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
    }

    const loadMoreContainer = document.getElementById("loadMoreContainer");
    const loadMoreBtn = document.getElementById("loadMoreBtn");

    if (resetPaging) {
      visibleCount = INITIAL_BATCH;
      const visibleItems = items.slice(0, visibleCount);
      const cardsHtml = visibleItems.map((sticker, index) => buildCardHtml(sticker, index)).join("");

      stickersGrid.innerHTML = cardsHtml;

      if (loadMoreContainer) {
        if (visibleCount < items.length) {
          loadMoreContainer.style.display = "flex";
          if (loadMoreBtn) {
            loadMoreBtn.innerHTML = `<span>Explore More Stickers</span> <span class="btn-arrow">↓</span>`;
          }
        } else {
          loadMoreContainer.style.display = "none";
        }
      }
    } else {
      // Incremental append: Directly append cards to stickersGrid without touching multi-column flow!
      const prevCount = visibleCount - APPEND_BATCH;
      const newItems = items.slice(prevCount, visibleCount);
      if (newItems.length > 0) {
        const newCardsHtml = newItems.map((sticker, idx) => buildCardHtml(sticker, prevCount + idx)).join("");
        stickersGrid.insertAdjacentHTML("beforeend", newCardsHtml);

        if (loadMoreContainer) {
          if (visibleCount >= items.length) {
            loadMoreContainer.style.display = "none";
          } else {
            loadMoreContainer.style.display = "flex";
            if (loadMoreBtn) {
              loadMoreBtn.innerHTML = `<span>Explore More Stickers</span> <span class="btn-arrow">↓</span>`;
            }
          }
        }
      }
    }

    // Attach IntersectionObservers for smooth lazy images & infinite scroll
    setupLazyImages();
    setupInfiniteScrollObserver();
  }

  function setupLazyImages() {
    const lazyImages = document.querySelectorAll("img[data-src]");
    if (!lazyImages.length) return;

    if (!window.IntersectionObserver) {
      lazyImages.forEach(img => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
        }
      });
      return;
    }

    if (!imageObserver) {
      imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute("data-src");
            }
            observer.unobserve(img);
          }
        });
      }, { rootMargin: "350px 0px" });
    }

    lazyImages.forEach(img => imageObserver.observe(img));
  }

  window.loadMoreStickers = function () {
    if (isAppending) return;
    const items = getFilteredStickers();
    if (visibleCount >= items.length) return;
    isAppending = true;
    visibleCount += APPEND_BATCH;
    renderStickers(false);
    setTimeout(() => { isAppending = false; }, 200);
  };

  function setupInfiniteScrollObserver() {
    if (scrollObserver) {
      scrollObserver.disconnect();
    }
    const trigger = document.getElementById("loadMoreContainer");
    if (!trigger || !window.IntersectionObserver) return;

    scrollObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        window.loadMoreStickers();
      }
    }, { rootMargin: "300px" });

    scrollObserver.observe(trigger);
  }

  /**
   * Setup Event Listeners
   */
  function setupEventListeners() {
    // Platform pill tabs
    platformButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        platformButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentPlatform = btn.dataset.platform;

        // Also sync with mobile dock
        document.querySelectorAll(".dock-item-btn").forEach(b => b.classList.remove("active"));
        const dockId = currentPlatform === "whatsapp" ? "dockWhatsappBtn" : currentPlatform === "discord" ? "dockDiscordBtn" : currentPlatform === "all" ? "dockHomeBtn" : null;
        if (dockId) {
          const dBtn = document.getElementById(dockId);
          if (dBtn) dBtn.classList.add("active");
        }

        renderStickers(true);
      });
    });

    // Category filter
    if (categoryFilter) {
      categoryFilter.addEventListener("change", (e) => {
        currentCategory = e.target.value;
        renderStickers(true);
      });
    }

    // Sort filter
    if (sortFilter) {
      sortFilter.addEventListener("change", (e) => {
        currentSort = e.target.value;
        renderStickers(true);
      });
    }

    // Search Input with Debounce
    let searchDebounce;
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
          currentSearchQuery = e.target.value;
          if (searchClearBtn) {
            searchClearBtn.style.display = currentSearchQuery ? "flex" : "none";
          }
          renderStickers(true);
        }, 180);
      });

      // Clear search button
      if (searchClearBtn) {
        searchClearBtn.addEventListener("click", () => {
          searchInput.value = "";
          currentSearchQuery = "";
          searchClearBtn.style.display = "none";
          renderStickers(true);
          searchInput.focus();
        });
      }

      // Search Action Button (GIPHY-Style Vibrant Pill)
      const searchActionBtn = document.getElementById("searchActionBtn");
      if (searchActionBtn) {
        searchActionBtn.addEventListener("click", () => {
          searchInput.focus();
          currentSearchQuery = searchInput.value.trim();
          renderStickers(true);
        });
      }

      // Enter key on search input triggers instant search & scroll
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          currentSearchQuery = searchInput.value.trim();
          renderStickers(true);
          const grid = document.getElementById("stickersGrid");
          if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    // GIPHY-Style Segmented Filter Buttons (Stickers vs GIFs)
    const segStickersBtn = document.getElementById("segStickersBtn");
    const segGifsBtn = document.getElementById("segGifsBtn");

    if (segStickersBtn) {
      segStickersBtn.addEventListener("click", () => {
        currentContentType = "all";
        segStickersBtn.classList.add("active");
        if (segGifsBtn) segGifsBtn.classList.remove("active");
        const feedTitle = document.getElementById("feedTitle");
        if (feedTitle) feedTitle.textContent = "Trending Now";
        renderStickers(true);
        showToast("✨ Showing all stickers & memes", "⭐");
      });
    }

    if (segGifsBtn) {
      segGifsBtn.addEventListener("click", () => {
        if (currentContentType === "gif") {
          currentContentType = "all";
          segGifsBtn.classList.remove("active");
          if (segStickersBtn) segStickersBtn.classList.add("active");
          const feedTitle = document.getElementById("feedTitle");
          if (feedTitle) feedTitle.textContent = "Trending Now";
          showToast("✨ Showing all stickers", "⭐");
        } else {
          currentContentType = "gif";
          segGifsBtn.classList.add("active");
          if (segStickersBtn) segStickersBtn.classList.remove("active");
          const feedTitle = document.getElementById("feedTitle");
          if (feedTitle) feedTitle.textContent = "Trending GIFs & Reactions";
          showToast("🎬 Filtered to Animated GIFs & Memes", "🔥");
        }
        renderStickers(true);
      });
    }

    // Quick Tag Buttons in Hero
    document.querySelectorAll(".quick-tag-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tag = btn.dataset.tag;
        if (searchInput) {
          searchInput.value = tag;
          currentSearchQuery = tag;
          if (searchClearBtn) searchClearBtn.style.display = "flex";
          renderStickers(true);
          searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });

    // Smooth Horizontal Scroll on Quick Tags with Mouse Wheel
    const quickTagsContainer = document.querySelector(".quick-tags-container");
    if (quickTagsContainer) {
      quickTagsContainer.addEventListener("wheel", (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          quickTagsContainer.scrollBy({ left: e.deltaY * 1.5, behavior: "smooth" });
        }
      }, { passive: false });
    }

    // Mobile Menu Toggle
    if (mobileMenuBtn && navLinks) {
      mobileMenuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("mobile-open");
      });
    }

    // Nav Dropdown Click Toggle & Outside Click
    const navDropdownItem = document.querySelector('.nav-dropdown-item');
    const navDropdownBtn = document.querySelector('.nav-dropdown-btn');
    if (navDropdownBtn && navDropdownItem) {
      navDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navDropdownItem.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!navDropdownItem.contains(e.target)) {
          navDropdownItem.classList.remove('open');
        }
      });
    }

    // Modal Close
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener("click", closeModal);
    }
    if (modalBackdrop) {
      modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) closeModal();
      });
    }

    // Modal Action Buttons
    if (modalCopyBtn) {
      modalCopyBtn.addEventListener("click", () => {
        if (activeModalSticker) {
          copyStickerImage(activeModalSticker.id);
        }
      });
    }
    if (modalDownloadBtn) {
      modalDownloadBtn.addEventListener("click", () => {
        if (activeModalSticker) {
          downloadSticker(activeModalSticker.id);
        }
      });
    }
    if (modalCopyLinkBtn) {
      modalCopyLinkBtn.addEventListener("click", () => {
        if (activeModalSticker) {
          const fullQualityUrl = getFullQualityImageUrl(activeModalSticker.imageUrl);
          navigator.clipboard.writeText(fullQualityUrl).then(() => {
            showToast("🔗 Full quality direct sticker URL copied!", "✨");
          });
        }
      });
    }
  }

  /**
   * Theme Setup (Dark / Light Sketchbook Mode)
   * Defaults to Dark Sketchbook Noir Mode!
   */
  function setupTheme() {
    const savedTheme = localStorage.getItem("stickerpencil_theme");
    // DEFAULT TO DARK MODE unless user explicitly picked 'light'
    const isDark = savedTheme !== "light";

    if (isDark) {
      document.documentElement.classList.add("sketch-dark-mode");
      document.body.classList.add("sketch-dark-mode");
      if (modeToggleBtn) modeToggleBtn.textContent = "☀️";
    } else {
      document.documentElement.classList.remove("sketch-dark-mode");
      document.body.classList.remove("sketch-dark-mode");
      if (modeToggleBtn) modeToggleBtn.textContent = "🌙";
    }

    if (modeToggleBtn) {
      modeToggleBtn.addEventListener("click", () => {
        const currentlyDark = document.body.classList.contains("sketch-dark-mode");
        const nextDark = !currentlyDark;

        if (nextDark) {
          document.documentElement.classList.add("sketch-dark-mode");
          document.body.classList.add("sketch-dark-mode");
          modeToggleBtn.textContent = "☀️";
          localStorage.setItem("stickerpencil_theme", "dark");
          showToast("Switched to Dark Sketchbook", "🌙");
        } else {
          document.documentElement.classList.remove("sketch-dark-mode");
          document.body.classList.remove("sketch-dark-mode");
          modeToggleBtn.textContent = "🌙";
          localStorage.setItem("stickerpencil_theme", "light");
          showToast("Switched to Notebook Paper", "☀️");
        }
      });
    }
  }

  /**
   * Modal Logic (Progressive Full-Quality Loading)
   * 1. Displays low-res thumbnail instantly from cache for 0ms delay
   * 2. Loads full original HD quality transparent PNG in background
   */
  window.openStickerModal = function (id) {
    const sticker = allStickers.find(s => s.id === id);
    if (!sticker) return;
    activeModalSticker = sticker;

    const lowResThumb = getLowResThumbnailUrl(sticker.imageUrl);
    const fullQualityUrl = getFullQualityImageUrl(sticker.imageUrl);
    const isGif = typeof isGifSticker === "function" ? isGifSticker(sticker) : false;

    // 1. Immediately show cached thumbnail for instant 0ms popup
    modalImg.onerror = () => {
      if (sticker.fallbackUrl) {
        modalImg.onerror = null;
        modalImg.src = sticker.fallbackUrl;
      }
    };
    modalImg.src = lowResThumb;
    modalImg.classList.remove("full-quality-loaded");
    modalImg.classList.add("low-res-placeholder");

    // 2. Setup Quality Badge
    let qualityBadge = document.getElementById("modalQualityBadge");
    if (!qualityBadge) {
      qualityBadge = document.createElement("div");
      qualityBadge.id = "modalQualityBadge";
      qualityBadge.className = "modal-quality-badge";
      const stage = document.querySelector(".modal-preview-stage");
      if (stage) stage.appendChild(qualityBadge);
    }
    if (qualityBadge) {
      qualityBadge.className = "modal-quality-badge loading";
      qualityBadge.innerHTML = isGif
        ? `<span class="badge-dot pulse" style="background:#00f0ff;"></span> Loading Animated GIF...`
        : `<span class="badge-dot pulse"></span> Loading Full HD...`;
    }

    // 3. Preload full quality original image
    const hiRes = new Image();
    hiRes.crossOrigin = "anonymous";
    hiRes.src = fullQualityUrl;
    hiRes.onload = () => {
      if (activeModalSticker && activeModalSticker.id === sticker.id) {
        modalImg.src = fullQualityUrl;
        modalImg.classList.remove("low-res-placeholder");
        modalImg.classList.add("full-quality-loaded");
        if (qualityBadge) {
          qualityBadge.className = "modal-quality-badge ready";
          qualityBadge.innerHTML = isGif
            ? `<span class="badge-dot ready" style="background:#00f0ff;box-shadow:0 0 6px #00f0ff;"></span> 🎬 Animated GIF (Original Frames)`
            : `<span class="badge-dot ready"></span> ✨ 100% Full HD Quality`;
        }
      }
    };
    hiRes.onerror = () => {
      if (sticker.fallbackUrl && activeModalSticker && activeModalSticker.id === sticker.id) {
        modalImg.src = sticker.fallbackUrl;
        modalImg.classList.remove("low-res-placeholder");
        modalImg.classList.add("full-quality-loaded");
        if (qualityBadge) {
          qualityBadge.className = "modal-quality-badge ready";
          qualityBadge.innerHTML = isGif
            ? `<span class="badge-dot ready" style="background:#00f0ff;box-shadow:0 0 6px #00f0ff;"></span> 🎬 Animated GIF (Original Frames)`
            : `<span class="badge-dot ready"></span> ✨ 100% Full HD Quality`;
        }
      }
    };

    modalTitle.textContent = sticker.title;
    modalCategory.textContent = isGif ? "Animated GIF" : (sticker.category || "Meme");
    modalPack.textContent = sticker.pack ? `📦 Pack: ${sticker.pack}` : "";

    if (modalDownloadBtn) {
      modalDownloadBtn.innerHTML = isGif
        ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Download Animated GIF (.gif)</span>`
        : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Download Full HD (PNG)</span>`;
    }
    if (modalCopyBtn) {
      modalCopyBtn.innerHTML = isGif
        ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy Animated GIF</span>`
        : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>1-Click Copy Image</span>`;
    }

    const modalPlatforms = document.getElementById("modalPlatforms");
    if (modalPlatforms) {
      modalPlatforms.innerHTML = (sticker.platforms || ["whatsapp", "discord"]).map(p => {
        return `<span class="platform-mini-pill ${p}" style="font-size: 0.74rem; padding: 2px 8px; text-transform: capitalize;">${p}</span>`;
      }).join("");
    }

    const modalStudioBtn = document.getElementById("modalStudioBtn");
    if (modalStudioBtn) {
      modalStudioBtn.href = `sticker-maker.html?sticker=${encodeURIComponent(sticker.id)}`;
    }

    // Tags
    if (modalTags) {
      modalTags.innerHTML = (sticker.tags || []).map(t => `<span class="modal-tag">#${t}</span>`).join("");
    }

    // Platform guides
    if (modalPlatformGuides) {
      modalPlatformGuides.innerHTML = (sticker.platforms || []).map(p => {
        const guide = PLATFORM_GUIDES[p];
        if (!guide) return "";
        return `
          <div class="guide-item" style="border-left: 4px solid ${guide.color};">
            <strong>${guide.icon} Use on ${guide.name}:</strong>
            ${guide.tip}
          </div>
        `;
      }).join("");
    }

    modalBackdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  function closeModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove("active");
    document.body.style.overflow = "";
    activeModalSticker = null;
  }

  /**
   * 1-Click Clipboard Copy Image (Full HD Original PNG or Animated GIF)
   */
  window.copyStickerImage = async function (id, e) {
    if (e) e.stopPropagation();
    const sticker = allStickers.find(s => s.id === id);
    if (!sticker) return;

    const isGif = typeof isGifSticker === "function" ? isGifSticker(sticker) : false;

    try {
      showToast(`⏳ Fetching ${isGif ? 'animated GIF' : 'full quality sticker'}...`, "📋");

      const fullQualityUrl = getFullQualityImageUrl(sticker.imageUrl);

      if (isGif) {
        // Handle Animated GIF (Do not flatten to canvas!)
        let copied = false;
        try {
          const response = await fetch(fullQualityUrl, { mode: "cors" });
          const gifBlob = await response.blob();
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/gif": gifBlob })
            ]);
            copied = true;
            showToast("🎬 Animated GIF copied! Ready to paste into your chats!", "🎉");
          } catch (clipErr) {
            // Rich HTML embed fallback for WhatsApp Web, Discord, Teams, Slack
            const htmlBlob = new Blob([`<img src="${fullQualityUrl}" alt="${sticker.title}">`], { type: "text/html" });
            const textBlob = new Blob([fullQualityUrl], { type: "text/plain" });
            await navigator.clipboard.write([
              new ClipboardItem({
                "text/html": htmlBlob,
                "text/plain": textBlob
              })
            ]);
            copied = true;
            showToast("🎬 Animated GIF copied! Paste into WhatsApp or Discord!", "🎉");
          }
        } catch (gifErr) {
          await navigator.clipboard.writeText(fullQualityUrl);
          copied = true;
          showToast("🔗 Animated GIF link copied to clipboard!", "✨");
        }
      } else if (sticker.imageUrl.startsWith("data:image/svg+xml") || sticker.imageUrl.endsWith(".svg")) {
        const pngBlob = await svgToPngBlob(sticker.imageUrl);
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": pngBlob })
        ]);
        showToast("✏️ Full quality sticker copied! Paste directly in your chats!", "🎉");
      } else {
        let response;
        try {
          response = await fetch(fullQualityUrl, { mode: "cors" });
          if (!response.ok && sticker.fallbackUrl) {
            response = await fetch(sticker.fallbackUrl);
          }
        } catch (fetchErr) {
          if (sticker.fallbackUrl) {
            response = await fetch(sticker.fallbackUrl);
          } else {
            throw fetchErr;
          }
        }
        const blob = await response.blob();

        if (blob.type === "image/png") {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ]);
        } else {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = sticker.fallbackUrl || fullQualityUrl;
          await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || 512;
          canvas.height = img.naturalHeight || 512;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          canvas.toBlob(async (canvasBlob) => {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": canvasBlob })
            ]);
          }, "image/png");
        }
        showToast("✏️ Full quality sticker copied! Paste into WhatsApp or Discord!", "🎉");
      }

      sticker.downloads = (sticker.downloads || 0) + 1;
      updateSticker(sticker.id, { downloads: sticker.downloads });
    } catch (err) {
      console.warn("Clipboard blob copy fallback:", err);
      const fullQualityUrl = getFullQualityImageUrl(sticker.imageUrl);
      await navigator.clipboard.writeText(fullQualityUrl);
      showToast("🔗 Full quality direct link copied to clipboard!", "✨");
    }
  };

  function svgToPngBlob(svgUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 512, 512);
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas blob conversion failed"));
        }, "image/png");
      };
      img.onerror = reject;
      img.src = svgUrl;
    });
  }

  /**
   * 1-Click Sticker Download (Full HD Original PNG or Animated GIF)
   */
  window.downloadSticker = async function (id, e) {
    if (e) e.stopPropagation();
    const sticker = allStickers.find(s => s.id === id);
    if (!sticker) return;

    const isGif = typeof isGifSticker === "function" ? isGifSticker(sticker) : false;
    const ext = isGif ? ".gif" : ".png";
    const filename = (sticker.title || "sticker")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + ext;

    try {
      showToast(`📥 Downloading ${isGif ? 'animated GIF' : 'full quality sticker'}...`, "⏳");

      const fullQualityUrl = getFullQualityImageUrl(sticker.imageUrl);
      let downloadUrl = fullQualityUrl;
      if (sticker.imageUrl.startsWith("data:image/svg+xml") || sticker.imageUrl.endsWith(".svg")) {
        const pngBlob = await svgToPngBlob(sticker.imageUrl);
        downloadUrl = URL.createObjectURL(pngBlob);
      } else {
        let response;
        try {
          response = await fetch(fullQualityUrl, { mode: "cors" });
          if (!response.ok && sticker.fallbackUrl) {
            response = await fetch(sticker.fallbackUrl);
          }
        } catch (fetchErr) {
          if (sticker.fallbackUrl) {
            response = await fetch(sticker.fallbackUrl);
          } else {
            throw fetchErr;
          }
        }
        const blob = await response.blob();
        downloadUrl = URL.createObjectURL(blob);
      }

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast(`✅ Saved ${filename}!`, "🎉");
      sticker.downloads = (sticker.downloads || 0) + 1;
      updateSticker(sticker.id, { downloads: sticker.downloads });
    } catch (err) {
      const fullQualityUrl = getFullQualityImageUrl(sticker.imageUrl);
      const a = document.createElement("a");
      a.href = fullQualityUrl;
      a.download = filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`✅ Download initiated!`, "🎉");
    }
  };

  /**
   * Sketchy Toast Notifications
   */
  window.showToast = function (message, icon = "✏️") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast-item";
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 350);
    }, 3000);
  };

  /**
   * Mobile Bottom Dock Quick Handlers (Phone Ergonomics)
   */
  window.filterByPlatformFromDock = function (platform) {
    const btn = document.querySelector(`.platform-pill-btn[data-platform="${platform}"]`);
    if (btn) btn.click();

    document.querySelectorAll(".dock-item-btn").forEach(b => b.classList.remove("active"));
    const dockId = platform === "whatsapp" ? "dockWhatsappBtn" : platform === "discord" ? "dockDiscordBtn" : "dockHomeBtn";
    const dockBtn = document.getElementById(dockId);
    if (dockBtn) dockBtn.classList.add("active");

    const target = document.getElementById("stickersGrid");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  window.focusMobileSearch = function () {
    const input = document.getElementById("searchInput");
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast("🔍 Type to search stickers...", "✏️");
    }
  };

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
