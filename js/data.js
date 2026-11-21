/**
 * STICKERPENCIL - CENTRAL DATA & CLOUDINARY CONFIGURATION ENGINE
 * 100% Real User Cloudinary CDN Uploads (Zero demo SVGs, zero placeholder assets)
 */

const CLOUDINARY_CONFIG = {
  // Cloud Name from user's Cloudinary account
  defaultCloudName: "iyh1dd7y",
  defaultUploadPreset: "stickers_preset",
  defaultApiKey: "Eych-n4uQDcapk5gfcGsqDM3f8Y",
  
  // Storage keys (v10 adds full animated GIF extension support & CDN auto-handling)
  STORAGE_KEY_STICKERS: "stickerpencil_stickers_v11",
  STORAGE_KEY_CONFIG: "stickerpencil_config_v1",
  STORAGE_KEY_AUTH: "stickerpencil_auth_v1",
  STORAGE_KEY_CUSTOM_PACKS: "stickerpencil_custom_packs_v1"
};

/**
 * Checks if a given URL points to an animated GIF
 */
function isGifUrl(url) {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return lower.endsWith(".gif") || 
         lower.includes(".gif?") || 
         lower.includes("/fl_animated") || 
         lower.includes("format,gif") ||
         lower.includes("f_gif") ||
         lower.includes(".gif/");
}

/**
 * Checks if a sticker is an animated GIF
 */
function isGifSticker(sticker) {
  if (!sticker) return false;
  if (sticker.format === "gif" || sticker.isAnimated === true) return true;
  if (Array.isArray(sticker.tags) && (
    sticker.tags.includes("gif") || 
    sticker.tags.includes("animated") || 
    sticker.tags.includes("gifs")
  )) {
    return true;
  }
  return isGifUrl(sticker.imageUrl) || isGifUrl(sticker.fallbackUrl);
}

// Expose helpers globally
window.isGifUrl = isGifUrl;
window.isGifSticker = isGifSticker;

/**
 * Returns current Cloudinary configuration from localStorage
 */
function getCloudinaryConfig() {
  const saved = localStorage.getItem(CLOUDINARY_CONFIG.STORAGE_KEY_CONFIG);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        cloudName: parsed.cloudName || CLOUDINARY_CONFIG.defaultCloudName,
        uploadPreset: parsed.uploadPreset || CLOUDINARY_CONFIG.defaultUploadPreset,
        apiKey: parsed.apiKey || CLOUDINARY_CONFIG.defaultApiKey
      };
    } catch (e) {
      console.error("Failed to parse Cloudinary config:", e);
    }
  }
  return {
    cloudName: CLOUDINARY_CONFIG.defaultCloudName,
    uploadPreset: CLOUDINARY_CONFIG.defaultUploadPreset,
    apiKey: CLOUDINARY_CONFIG.defaultApiKey
  };
}

/**
 * Saves Cloudinary configuration to localStorage
 */
function saveCloudinaryConfig(config) {
  const current = getCloudinaryConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(CLOUDINARY_CONFIG.STORAGE_KEY_CONFIG, JSON.stringify(updated));
}

/**
 * Transforms any image URL with Cloudinary optimization params if it's a Cloudinary URL,
 * or safely normalizes inline SVGs and standard responsive URLs.
 * @param {string} url - Original image URL or Cloudinary public ID
 * @param {Object} options - { width: number, format: string, quality: string, preset: 'thumb'|'full' }
 */
function getOptimizedImageUrl(url, options = {}) {
  if (!url) return "";

  // Presets
  if (options.preset === "thumb") {
    return getLowResThumbnailUrl(url);
  }
  if (options.preset === "full") {
    return getFullQualityImageUrl(url);
  }
  
  const width = options.width || 400;
  const quality = options.quality || "auto";
  const isGif = isGifUrl(url);

  // If it's a Cloudinary URL
  if (typeof url === "string" && url.includes("res.cloudinary.com")) {
    if (url.includes("/image/upload/")) {
      const parts = url.split("/image/upload/");
      const cleanPath = parts[1].replace(/^(?:(?:[a-z]{1,3}_[^/]+|v\d+),?)+\//i, "");
      if (isGif || cleanPath.toLowerCase().endsWith(".gif")) {
        return `${parts[0]}/image/upload/w_${width},c_limit,fl_animated/${cleanPath}`;
      }
      const transformation = options.format 
        ? `f_${options.format},q_${quality},w_${width},c_limit/` 
        : `q_${quality},w_${width},c_limit/`;
      return `${parts[0]}/image/upload/${transformation}${cleanPath}`;
    }
    return url;
  }

  // If user passed just a Cloudinary public ID
  if (typeof url === "string" && !url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("data:") && !url.startsWith("assets/") && !url.startsWith("/") && !url.startsWith("./")) {
    const config = getCloudinaryConfig();
    if (isGif || url.toLowerCase().endsWith(".gif")) {
      return `https://res.cloudinary.com/${config.cloudName}/image/upload/w_${width},c_limit,fl_animated/${url}`;
    }
    const transformation = options.format 
      ? `f_${options.format},q_${quality},w_${width},c_limit/` 
      : `q_${quality},w_${width},c_limit/`;
    return `https://res.cloudinary.com/${config.cloudName}/image/upload/${transformation}${url}`;
  }

  return url;
}

/**
 * ⚡ LOW RESOLUTION THUMBNAIL (For blazing-fast grid & list loading)
 * Compresses image to ~3-4 KB with (w_280, q_60, f_auto) so thousands of stickers
 * load instantaneously on initial page view without eating user bandwidth.
 * For animated GIFs, uses fl_animated + q_auto:eco so animation plays smoothly!
 */
function getLowResThumbnailUrl(url) {
  if (!url) return "";
  const isGif = isGifUrl(url);

  if (typeof url === "string" && url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    const parts = url.split("/image/upload/");
    const cleanPath = parts[1].replace(/^(?:(?:[a-z]{1,3}_[^/]+|v\d+),?)+\//i, "");
    if (isGif || cleanPath.toLowerCase().endsWith(".gif")) {
      // Keep animation alive on thumbnail with lightweight eco frames
      return `${parts[0]}/image/upload/w_300,c_limit,q_auto:eco,fl_animated/${cleanPath}`;
    }
    return `${parts[0]}/image/upload/w_340,q_auto:good,f_auto,c_limit/${cleanPath}`;
  }
  if (typeof url === "string" && !url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("data:") && !url.startsWith("assets/") && !url.startsWith("/") && !url.startsWith("./")) {
    const config = getCloudinaryConfig();
    if (isGif || url.toLowerCase().endsWith(".gif")) {
      return `https://res.cloudinary.com/${config.cloudName}/image/upload/w_300,c_limit,q_auto:eco,fl_animated/${url}`;
    }
    return `https://res.cloudinary.com/${config.cloudName}/image/upload/w_340,q_auto:good,f_auto,c_limit/${url}`;
  }
  return url;
}

/**
 * ✨ FULL RESOLUTION & MAXIMUM QUALITY (When user clicks into a sticker)
 * Delivers 100% crisp, uncompressed full resolution original PNG or animated GIF
 * for details modal, 1-click clipboard copying, and file downloads.
 */
function getFullQualityImageUrl(url) {
  if (!url) return "";
  const isGif = isGifUrl(url);

  if (typeof url === "string" && url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    const parts = url.split("/image/upload/");
    // Strip any downscaling transformations (like q_auto,w_400/ or v1234/)
    const cleanPath = parts[1].replace(/^(?:(?:[a-z]{1,3}_[^/]+|v\d+),?)+\//i, "");
    if (isGif || cleanPath.toLowerCase().endsWith(".gif")) {
      // Deliver untouched original animated GIF with 100% frame fidelity
      return `${parts[0]}/image/upload/fl_animated/${cleanPath}`;
    }
    return `${parts[0]}/image/upload/q_auto:best,f_auto/${cleanPath}`;
  }
  if (typeof url === "string" && !url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("data:") && !url.startsWith("assets/") && !url.startsWith("/") && !url.startsWith("./")) {
    const config = getCloudinaryConfig();
    if (isGif || url.toLowerCase().endsWith(".gif")) {
      return `https://res.cloudinary.com/${config.cloudName}/image/upload/fl_animated/${url}`;
    }
    return `https://res.cloudinary.com/${config.cloudName}/image/upload/q_auto:best,f_auto/${url}`;
  }
  return url;
}

/**
 * Completely raw Cloudinary asset URL without any transform flags
 */
function getRawOriginalImageUrl(url) {
  if (!url) return "";
  if (typeof url === "string" && url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    const parts = url.split("/image/upload/");
    const cleanPath = parts[1].replace(/^(?:(?:[a-z]_[^/]+|v\d+),?)+\//, "");
    return `${parts[0]}/image/upload/${cleanPath}`;
  }
  return url;
}

/**
 * Curated Themed Sticker Packs (100% matched to user's real Cloudinary folders)
 */
const STICKER_PACKS = [
  {
    id: "pack-cats-hinglish",
    name: "Cats Hinglish Doodles",
    description: "Hilarious desi cat memes, grumpy kitties, and relatable Hinglish expressions for WhatsApp and Discord.",
    icon: "🐱",
    color: "#fef08a",
    slug: "cats-hinglish-doodles"
  },
  {
    id: "pack-hinglish-viral",
    name: "Desi Hinglish Viral",
    description: "The freshest viral desi memes, snappy one-liners, and trending Bollywood Hinglish banter.",
    icon: "🔥",
    color: "#bae6fd",
    slug: "desi-hinglish-viral"
  },
  {
    id: "pack-hinglish-classics",
    name: "Hinglish Classics",
    description: "Timeless Hindi-English dialogues, bakchodi stickers, and mood-defining chat reactions.",
    icon: "💬",
    color: "#bbf7d0",
    slug: "hinglish-classics"
  },
  {
    id: "pack-doggo",
    name: "Doggo Memes & Reactions",
    description: "Wholesome pups, chaotic doggos, side-eye hounds, and funny canine reactions for group chats.",
    icon: "🐶",
    color: "#fed7aa",
    slug: "doggo-memes-reactions"
  },
  {
    id: "pack-cute-kids",
    name: "Cute Kids & Babies",
    description: "Adorable baby reactions, chubby cheek smiles, dramatic cries, and wholesome mood-lifters.",
    icon: "👶",
    color: "#fbcfe8",
    slug: "cute-kids-babies"
  },
  {
    id: "pack-jolochip",
    name: "Jolochip Phuyawrr",
    description: "Ultra spicy Jolochip challenge reactions, screaming faces, fire expressions, and wild meme banter.",
    icon: "🌶️",
    color: "#fecaca",
    slug: "jolochip-phuyawrr"
  },
  {
    id: "pack-silly-goofs",
    name: "Silly Goofs & Brainrot",
    description: "Chaotic energy, derpy faces, weird animals, and peak brainrot internet humor.",
    icon: "🤪",
    color: "#e0e7ff",
    slug: "silly-goofs-brainrot"
  },
  {
    id: "pack-western-pop",
    name: "Western Pop & Aesthetic",
    description: "Retro Western pop culture, vintage cowboy vibes, trendy cartoon icons, and pastel doodles.",
    icon: "✨",
    color: "#f5d0fe",
    slug: "western-pop-aesthetic"
  },
  {
    id: "pack-for-divas",
    name: "For Divas & Queens",
    description: "Fabulous diva expressions, slay attitudes, high-glam vibes, and iconic queen chat reactions.",
    icon: "💅",
    color: "#f472b6",
    slug: "for-divas-queens"
  },
  {
    id: "pack-trending-viral-gifs",
    name: "Trending Viral GIFs",
    description: "Massive curated collection of 843 animated reaction GIFs for WhatsApp, Discord, Instagram & Telegram.",
    icon: "🔥",
    color: "#a855f7",
    slug: "trending-viral-gifs"
  }
];

/**
 * Detects an appropriate sketch emoji icon based on pack name keywords
 */
function detectPackIcon(name) {
  if (!name) return "📦";
  const low = name.toLowerCase();
  if (/(jolo|chip|hot|spice|chili|pepper)/i.test(low)) return "🌶️";
  if (/(diva|queen|slay|glam|fashion)/i.test(low)) return "💅";
  if (/(cat|billi|kitten|meow)/i.test(low)) return "🐱";
  if (/(dog|puppy|bark|woof)/i.test(low)) return "🐶";
  if (/(baby|kid|child|cute)/i.test(low)) return "👶";
  if (/(desi|bollywood|viral|fire|flame)/i.test(low)) return "🔥";
  if (/(brainrot|silly|derp|goof|clown)/i.test(low)) return "🤪";
  if (/(pop|retro|western|vintage|aesthetic)/i.test(low)) return "✨";
  if (/(anime|manga|kawaii|waifu)/i.test(low)) return "🌸";
  if (/(game|gaming|pixel|discord)/i.test(low)) return "👾";
  if (/(chat|dialogue|hinglish|text)/i.test(low)) return "💬";
  if (/(love|heart|romance)/i.test(low)) return "💖";
  return "📦";
}

/**
 * Detects an aesthetic pastel sketch color for the pack badge
 */
function detectPackColor(name) {
  if (!name) return "#e0e7ff";
  const low = name.toLowerCase();
  if (/(jolo|chip|hot|spice)/i.test(low)) return "#fecaca"; // soft red/coral
  if (/(diva|queen|slay|glam)/i.test(low)) return "#f472b6"; // soft pink/rose
  if (/(cat|billi|kitten)/i.test(low)) return "#fef08a"; // soft yellow
  if (/(dog|puppy)/i.test(low)) return "#fed7aa"; // soft orange
  if (/(baby|kid)/i.test(low)) return "#fbcfe8"; // soft pink
  if (/(desi|viral)/i.test(low)) return "#bae6fd"; // soft cyan
  if (/(classic|dialogue)/i.test(low)) return "#bbf7d0"; // soft mint green
  if (/(silly|brainrot)/i.test(low)) return "#e0e7ff"; // soft indigo
  if (/(western|pop|aesthetic)/i.test(low)) return "#f5d0fe"; // soft violet
  if (/(anime|kawaii)/i.test(low)) return "#fed7e2";
  return "#e2e8f0";
}

/**
 * Formats raw pack/folder titles into clean title case
 */
function formatPackTitle(rawName) {
  if (!rawName) return "Curated Pack";
  const cleaned = rawName.replace(/[-_]+/g, " ").trim();
  return cleaned.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

/**
 * Dynamic Pack Registry: Combines built-in packs + auto-detected packs from Cloudinary / data.
 * Whenever a user uploads a new pack to Cloudinary or sets a new `s.pack`, this automatically
 * creates the pack metadata and returns it to the site!
 */
function getStickerPacks() {
  const stickers = getStickers();
  const packMap = new Map();

  // 1. Seed with STICKER_PACKS
  STICKER_PACKS.forEach(p => {
    packMap.set(p.name.toLowerCase(), { ...p, count: 0 });
  });

  // 2. Discover any newly uploaded packs from stickers
  stickers.forEach(s => {
    const pName = (s.pack || "").trim();
    if (!pName || pName === "General" || pName === "Community Uploads") return;
    const key = pName.toLowerCase();
    if (!packMap.has(key)) {
      const displayName = formatPackTitle(pName);
      const icon = detectPackIcon(pName);
      const color = detectPackColor(pName);
      const slug = pName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      packMap.set(key, {
        id: "pack-" + slug,
        name: pName,
        displayName: displayName,
        description: `Curated ${displayName} collection of transparent stickers, ready for WhatsApp, Discord & Telegram.`,
        icon: icon,
        color: color,
        slug: slug,
        count: 0,
        autoDetected: true
      });
    }
    const packObj = packMap.get(key);
    if (packObj) packObj.count = (packObj.count || 0) + 1;
  });

  return Array.from(packMap.values());
}

/**
 * Platform Metadata & Instructions
 */
const PLATFORM_GUIDES = {
  whatsapp: {
    name: "WhatsApp",
    color: "#25d366",
    icon: "💬",
    tip: "On WhatsApp Web, click 'Copy Sticker Image' and paste directly (Ctrl+V) into any chat! On phone, save as PNG or import whole pack using Sticker.ly."
  },
  discord: {
    name: "Discord",
    color: "#5865f2",
    icon: "👾",
    tip: "Click 'Copy Image', then paste directly into Discord chat. Or upload to Server Settings > Emoji / Stickers to make it a custom server emote."
  },
  instagram: {
    name: "Instagram",
    color: "#e1306c",
    icon: "📸",
    tip: "In Instagram Stories, open stickers tray, choose the 'Photo/Gallery Sticker' tool, and select the transparent PNG."
  },
  snapchat: {
    name: "Snapchat",
    color: "#fffc00",
    icon: "👻",
    tip: "Take a snap, tap the Scissors / Paperclip icon, pick from Camera Roll, and pinch-zoom anywhere on your snap."
  },
  reddit: {
    name: "Reddit",
    color: "#ff4500",
    icon: "🤖",
    tip: "In comment boxes supporting images/emotes, paste or upload the sticker PNG for maximum upvotes."
  },
  telegram: {
    name: "Telegram",
    color: "#229ed9",
    icon: "✈️",
    tip: "Forward transparent PNG stickers to the @Stickers bot on Telegram to publish your own instant pack in 30 seconds."
  }
};

/**
 * Pure Real User Cloudinary Stickers (Zero Demo SVGs)
 */
function getAllBuiltInStickers() {
  if (typeof CLOUDINARY_UPLOADED_STICKERS !== "undefined" && Array.isArray(CLOUDINARY_UPLOADED_STICKERS)) {
    return CLOUDINARY_UPLOADED_STICKERS;
  }
  return [];
}

const INITIAL_STICKERS = getAllBuiltInStickers();

/**
 * Storage Helpers
 */
function getStickers() {
  // Purge legacy storage versions
  try {
    for (let i = 1; i <= 12; i++) {
      localStorage.removeItem(`stickerpencil_stickers_v${i}`);
    }
  } catch (e) {}

  return getAllBuiltInStickers();
}

function saveStickers(stickers) {
  try {
    localStorage.setItem(CLOUDINARY_CONFIG.STORAGE_KEY_STICKERS, JSON.stringify(stickers));
  } catch (e) {
    console.warn("Storage quota limit reached in localStorage:", e);
  }
}

function addSticker(sticker) {
  const stickers = getStickers();
  const isGif = isGifSticker(sticker) || isGifUrl(sticker.imageUrl);
  let tags = Array.isArray(sticker.tags) ? [...sticker.tags] : [];
  if (isGif && !tags.includes("gif")) tags.push("gif");
  if (isGif && !tags.includes("animated")) tags.push("animated");

  const newSticker = {
    id: sticker.id || "stk-" + Date.now().toString(36),
    title: sticker.title || "Untitled Sticker",
    imageUrl: sticker.imageUrl || "",
    category: sticker.category || "Memes",
    platforms: Array.isArray(sticker.platforms) && sticker.platforms.length > 0 
      ? sticker.platforms 
      : ["whatsapp", "discord"],
    tags: tags,
    pack: sticker.pack || "Community Uploads",
    format: isGif ? "gif" : (sticker.format || "png"),
    isAnimated: isGif,
    featured: Boolean(sticker.featured),
    downloads: sticker.downloads || 0,
    createdAt: sticker.createdAt || new Date().toISOString().split("T")[0]
  };
  stickers.unshift(newSticker);
  saveStickers(stickers);
  return newSticker;
}

function updateSticker(id, updatedFields) {
  const stickers = getStickers();
  const index = stickers.findIndex(s => s.id === id);
  if (index !== -1) {
    stickers[index] = { ...stickers[index], ...updatedFields };
    saveStickers(stickers);
    return stickers[index];
  }
  return null;
}

function deleteSticker(id) {
  const stickers = getStickers();
  const filtered = stickers.filter(s => s.id !== id);
  saveStickers(filtered);
  return filtered;
}

function resetToDefaultSeed() {
  const allInitial = getAllBuiltInStickers();
  saveStickers(allInitial);
  return allInitial;
}
