/**
 * STICKERPENCIL - GROQ AI SEO ENGINE
 * Automatically generates high-ranking SEO content, metadata, long-form reviews,
 * chat use-cases, and Google-rich FAQ schemas for any new sticker bundle using Groq LLM.
 */

const GROQ_CONFIG = {
  defaultApiKey: "",
  storageKey: "stickerpencil_groq_key",
  storageSeoCache: "stickerpencil_pack_seo_cache_v1",
  models: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]
};

function getGroqApiKey() {
  return localStorage.getItem(GROQ_CONFIG.storageKey) || GROQ_CONFIG.defaultApiKey;
}

function saveGroqApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem(GROQ_CONFIG.storageKey, key.trim());
  }
}

/**
 * Get cached SEO content for a pack from localStorage
 */
function getCachedPackSeo(packSlug) {
  try {
    const raw = localStorage.getItem(GROQ_CONFIG.storageSeoCache);
    if (raw) {
      const cache = JSON.parse(raw);
      return cache[packSlug] || null;
    }
  } catch (e) {}
  return null;
}

/**
 * Save SEO content for a pack in localStorage cache
 */
function savePackSeoToCache(packSlug, seoData) {
  try {
    const raw = localStorage.getItem(GROQ_CONFIG.storageSeoCache);
    const cache = raw ? JSON.parse(raw) : {};
    cache[packSlug] = seoData;
    localStorage.setItem(GROQ_CONFIG.storageSeoCache, JSON.stringify(cache));
  } catch (e) {}
}

/**
 * Generate rich SEO content for a pack using Groq AI
 */
async function generatePackSeoWithGroq(packName, category, count, sampleStickers = []) {
  const apiKey = getGroqApiKey();
  const sampleTitles = sampleStickers.slice(0, 5).map(s => s.title || s.name).filter(Boolean).join(", ");

  const prompt = `You are an elite SEO copywriter and viral meme curator for StickerPencil.com.
Generate high-ranking, engaging SEO content for a transparent sticker pack named '${packName}'.
Details:
- Pack Name: ${packName}
- Category: ${category || 'Memes & Reactions'}
- Sticker Count: ${count || 100} transparent stickers
- Sample Stickers: ${sampleTitles || 'Popular viral meme stickers'}
- Formats: Transparent PNG and Animated GIF
- Supported Apps: WhatsApp, Discord, Instagram Stories, Snapchat, Telegram, Reddit

Return STRICTLY a JSON object without markdown fences (no \`\`\`json):
{
  "metaTitle": "Catchy Title under 65 chars with high-intent keywords",
  "metaDescription": "Under 155 chars engaging meta description for search engines",
  "heroTagline": "1 punchy, funny headline for the pack header",
  "overview": "Two detailed paragraphs (~150-200 words) describing the vibe, humor, and why it goes viral in group chats",
  "chatUseCases": [
    {"title": "Scenario 1", "description": "Specific tip on when to drop this sticker"},
    {"title": "Scenario 2", "description": "Specific tip on when to drop this sticker"},
    {"title": "Scenario 3", "description": "Specific tip on when to drop this sticker"}
  ],
  "faq": [
    {"question": "How do I add ${packName} stickers to WhatsApp?", "answer": "Clear step-by-step instructions"},
    {"question": "Can I use these stickers on Discord without Nitro?", "answer": "Clear instructions for server emotes vs pasting"},
    {"question": "Are these transparent PNGs and GIFs free for personal use?", "answer": "Confirmation that all stickers are 100% free"},
    {"question": "How do I use these on Instagram Stories and Snapchat?", "answer": "Clear mobile sticker tray instructions"}
  ],
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
}`;

  for (const model of GROQ_CONFIG.models) {
    try {
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!resp.ok) {
        console.warn(`Groq ${model} failed with HTTP ${resp.status}`);
        continue;
      }

      const data = await resp.json();
      let text = data.choices[0]?.message?.content?.trim() || "";
      // Strip markdown code fences if present
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      const parsed = JSON.parse(text);
      if (parsed && parsed.metaTitle && parsed.overview) {
        return parsed;
      }
    } catch (err) {
      console.warn(`Groq error on model ${model}:`, err);
    }
  }

  // Fallback if all models fail
  return getFallbackPackSeo(packName, category, count);
}

/**
 * Deterministic fallback SEO content
 */
function getFallbackPackSeo(packName, category, count) {
  const cleanName = packName.replace(/ Stickers| Pack/gi, "");
  return {
    metaTitle: `${cleanName} Stickers (${count || '100+'}+ Free WhatsApp & Discord Emotes)`,
    metaDescription: `Download free transparent ${cleanName} stickers for WhatsApp, Discord, Telegram & Instagram. 1-click copy or get complete HD PNG bundle.`,
    heroTagline: `The Ultimate ${cleanName} Digital Sticker Collection for Group Chats`,
    overview: `Level up your everyday chats with the official ${cleanName} sticker pack. Featuring over ${count || '100+'} handcrafted transparent PNG and animated GIF expressions, this bundle captures every hilarious, sarcastic, and wholesome reaction in your WhatsApp groups, Discord servers, and Instagram DMs.\n\nEvery sticker is optimized with clean transparent outlines, ensuring they pop on both dark mode and light mode interfaces across iOS, Android, and Desktop.`,
    chatUseCases: [
      { title: "Banter & Roasts in Group Chats", description: "Drop the perfect sassy or deadpan reaction when friends make ridiculous claims." },
      { title: "Discord Server Custom Emotes", description: "Upload into your server as custom emotes for the squad without requiring Nitro." },
      { title: "Instagram Stories & Snapchat Snaps", description: "Paste transparent stickers directly onto photos and videos for effortless aesthetic flair." }
    ],
    faq: [
      { question: `How do I add ${cleanName} stickers to WhatsApp?`, answer: "On WhatsApp Web, click 'Copy Sticker Image' and paste directly (Ctrl+V). On phone, save the transparent PNG and import via Sticker.ly or WhatsApp's native sticker maker." },
      { question: "Can I use these stickers on Discord without Nitro?", answer: "Yes! You can either copy and paste the transparent sticker image directly into any channel, or server admins can upload them as custom emotes." },
      { question: "Are these transparent PNGs and GIFs 100% free?", answer: "Yes, all stickers on StickerPencil are completely free to copy, download, and share for personal use." },
      { question: "How do I animate or customize these stickers?", answer: "Click 'Animate & Edit in Studio' on any sticker to open our free built-in Sticker Maker Studio to add outlines, wobble animations, and custom text." }
    ],
    seoKeywords: [
      `${cleanName.lower ? cleanName.toLowerCase() : cleanName} stickers`,
      "free whatsapp stickers",
      "discord emotes transparent",
      "meme stickers bundle",
      "telegram sticker pack"
    ]
  };
}

// Global exports
window.GROQ_CONFIG = GROQ_CONFIG;
window.getGroqApiKey = getGroqApiKey;
window.saveGroqApiKey = saveGroqApiKey;
window.getCachedPackSeo = getCachedPackSeo;
window.savePackSeoToCache = savePackSeoToCache;
window.generatePackSeoWithGroq = generatePackSeoWithGroq;
window.getFallbackPackSeo = getFallbackPackSeo;

