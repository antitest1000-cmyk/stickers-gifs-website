/**
 * StickerPencil - Shared Navigation, Dropdown & Theme Controller
 * Ensures clean vector SVG icons, zero-FOUC theme toggling, and touch/mobile support across all pages.
 */
(function() {
  function initNav() {
    const modeToggleBtn = document.getElementById("modeToggleBtn");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const navLinks = document.getElementById("navLinks");
    const dropdownItem = document.querySelector(".nav-dropdown-item");
    const dropdownBtn = document.querySelector(".nav-dropdown-btn");

    function updateThemeUI(isDark) {
      if (!modeToggleBtn) return;
      modeToggleBtn.setAttribute("title", isDark ? "Switch to Light Mode" : "Switch to Dark Mode");
      modeToggleBtn.setAttribute("aria-label", isDark ? "Switch to Light Mode" : "Switch to Dark Mode");
      // Never overwrite textContent or innerHTML so vector SVGs remain crisp!
    }

    // Initialize Theme (Default Dark)
    const savedTheme = localStorage.getItem("stickerpencil_theme");
    const isDark = savedTheme !== "light";
    if (isDark) {
      document.documentElement.classList.add("sketch-dark-mode");
      if (document.body) document.body.classList.add("sketch-dark-mode");
    } else {
      document.documentElement.classList.remove("sketch-dark-mode");
      if (document.body) document.body.classList.remove("sketch-dark-mode");
    }
    updateThemeUI(isDark);

    // Theme Toggle Button
    if (modeToggleBtn && !modeToggleBtn._hasNavCommonListener) {
      modeToggleBtn._hasNavCommonListener = true;
      modeToggleBtn.addEventListener("click", () => {
        const currentlyDark = document.documentElement.classList.contains("sketch-dark-mode") || (document.body && document.body.classList.contains("sketch-dark-mode"));
        const nextDark = !currentlyDark;
        if (nextDark) {
          document.documentElement.classList.add("sketch-dark-mode");
          if (document.body) document.body.classList.add("sketch-dark-mode");
          localStorage.setItem("stickerpencil_theme", "dark");
        } else {
          document.documentElement.classList.remove("sketch-dark-mode");
          if (document.body) document.body.classList.remove("sketch-dark-mode");
          localStorage.setItem("stickerpencil_theme", "light");
        }
        updateThemeUI(nextDark);
      });
    }

    // Mobile Menu Drawer
    if (mobileMenuBtn && navLinks && !mobileMenuBtn._hasNavCommonListener) {
      mobileMenuBtn._hasNavCommonListener = true;
      mobileMenuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navLinks.classList.toggle("mobile-open");
      });
    }

    // Dropdown Navigation ("More ▾")
    if (dropdownItem && dropdownBtn && !dropdownBtn._hasNavCommonListener) {
      dropdownBtn._hasNavCommonListener = true;
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNav);
  } else {
    initNav();
  }
})();

