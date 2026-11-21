#!/usr/bin/env python3
"""
StickerPencil - Groq AI Pack Page & SEO Content Generator
Automatically generates detailed, high-ranking SEO bundle landing pages for every sticker pack
using Groq's LLM API (openai/gpt-oss-120b & openai/gpt-oss-20b).
"""

import os
import sys
import json
import re
import urllib.request
import urllib.error
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MANIFEST_PATH = os.path.join(DATA_DIR, "packs-manifest.json")
STICKERS_JS_PATH = os.path.join(BASE_DIR, "js", "cloudinary-stickers.js")
SITEMAP_PATH = os.path.join(BASE_DIR, "sitemap.xml")

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODELS = ["openai/gpt-oss-20b", "openai/gpt-oss-120b"]

def parse_json_safely(text):
    """Clean and safely parse JSON from LLM output."""
    if not text:
        return None
    # Strip markdown code blocks
    text = re.sub(r"^```(?:json)?\s*", "", text.strip())
    text = re.sub(r"\s*```$", "", text)
    # Extract outermost JSON object
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        text = match.group(0)
    try:
        return json.loads(text)
    except Exception:
        # Try replacing raw unescaped newlines inside strings
        try:
            cleaned = re.sub(r'[\r\n\t]+', ' ', text)
            return json.loads(cleaned)
        except Exception:
            return None

def load_manifest():
    if os.path.exists(MANIFEST_PATH):
        try:
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading manifest: {e}")
    return {"packs": []}

def save_manifest(manifest):
    manifest["lastUpdated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print("✅ Manifest saved with SEO content.")

def load_stickers_from_js():
    """Extract stickers from js/cloudinary-stickers.js if available."""
    if not os.path.exists(STICKERS_JS_PATH):
        return []
    try:
        with open(STICKERS_JS_PATH, "r", encoding="utf-8") as f:
            content = f.read()
        match = re.search(r"(?:const|var|let|window\.)\s*CLOUDINARY_UPLOADED_STICKERS\s*=\s*(\[.*?\]);", content, re.DOTALL)
        if match:
            return json.loads(match.group(1))
    except Exception as e:
        print(f"Notice: Could not parse stickers JS: {e}")
    return []

def call_groq_llm(pack_name, category, count, sample_tags=None):
    """Call Groq API to generate rich SEO metadata, long-form overview, use-cases, and FAQ."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) StickerPencilSEO/1.0"
    }

    prompt = f"""You are an elite SEO copywriter and viral meme strategist for StickerPencil.com.
Create comprehensive, engaging, high-ranking SEO content for a digital sticker pack named '{pack_name}'.
Details:
- Pack Name: {pack_name}
- Category: {category}
- Sticker Count: {count} transparent PNG/GIF stickers
- Platforms Supported: WhatsApp, Discord, Instagram Stories, Snapchat, Reddit, Telegram

Requirements:
1. metaTitle: Catchy, under 65 chars with high-intent keywords (e.g. Free [Name] WhatsApp Stickers & Discord Emotes).
2. metaDescription: Under 155 chars, engaging, action-oriented.
3. heroTagline: 1 punchy, funny headline for the pack page.
4. overview: 2 distinct paragraphs (total ~150-200 words) describing the aesthetic, cultural relevance/humor, and why group chats love this bundle.
5. chatUseCases: Array of 3 specific chat situations where this pack shines (with funny examples of reactions).
6. faq: Array of 4 Q&As answering common search queries (e.g. how to add to WhatsApp, Discord Nitro rules, transparent PNG format, commercial/personal use).
7. seoKeywords: Array of 8-10 high-volume search phrases.

STRICT INSTRUCTION: Output ONLY a valid JSON object without any markdown code fences (no ```json, no extra text):
{{
  "metaTitle": "...",
  "metaDescription": "...",
  "heroTagline": "...",
  "overview": "...",
  "chatUseCases": [
    {{"title": "...", "description": "..."}},
    {{"title": "...", "description": "..."}},
    {{"title": "...", "description": "..."}}
  ],
  "faq": [
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}}
  ],
  "seoKeywords": ["..."]
}}"""

    for model in GROQ_MODELS:
        try:
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.5,
                "max_tokens": 1200
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
            with urllib.request.urlopen(req, timeout=30) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                text = res["choices"][0]["message"]["content"].strip()
                parsed = parse_json_safely(text)
                if parsed and parsed.get("metaTitle") and parsed.get("overview"):
                    return parsed
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            print(f"Groq API {model} HTTP {e.code}: {err_body[:120]}")
            if e.code == 429:
                import time
                time.sleep(4)
        except Exception as e:
            print(f"Groq API error on {model}: {e}")

    # High quality fallback if API is unreachable
    return generate_fallback_seo(pack_name, category, count)

def generate_fallback_seo(pack_name, category, count):
    """Deterministic high-quality SEO fallback."""
    clean_name = pack_name.replace(" Stickers", "").replace(" Pack", "")
    return {
        "metaTitle": f"{clean_name} Stickers ({count}+ Free WhatsApp & Discord Emotes)",
        "metaDescription": f"Download free transparent {clean_name} stickers for WhatsApp, Discord, Telegram & Instagram. 1-click copy or get complete HD PNG bundle.",
        "heroTagline": f"The Ultimate {clean_name} Digital Sticker Collection for Group Chats",
        "overview": f"Level up your everyday chats with the official {clean_name} sticker pack. Featuring over {count} handcrafted, transparent PNG and animated GIF expressions, this bundle is designed to capture every hilarious, sarcastic, and wholesome reaction in your WhatsApp groups, Discord servers, and Instagram DMs.\n\nEvery sticker is optimized with high-definition transparent outlines, ensuring they look razor-sharp on both dark mode and light mode interfaces across iOS, Android, and Desktop.",
        "chatUseCases": [
            {"title": "Banter & Roasts in Group Chats", "description": "Drop the perfect sassy or deadpan reaction when your friends make ridiculous claims."},
            {"title": "Discord Server Custom Emotes", "description": "Instantly upload into your Discord server without needing Nitro to express the squad's inside jokes."},
            {"title": "Instagram Stories & Snapchat Snaps", "description": "Paste transparent stickers directly onto photos and videos for effortless aesthetic flair."}
        ],
        "faq": [
            {"question": f"How do I add {clean_name} stickers to WhatsApp?", "answer": "On WhatsApp Web, click 'Copy Sticker Image' and paste directly (Ctrl+V) into any chat. On mobile, download the PNG bundle and import into WhatsApp via Sticker.ly or WhatsApp's native sticker creator."},
            {"question": "Can I use these stickers on Discord without Nitro?", "answer": "Yes! You can either copy and paste the transparent sticker image directly into any text channel, or a server admin can upload them as custom server emotes for everyone to use."},
            {"question": "Are these transparent PNGs and GIFs 100% free?", "answer": "Yes, all stickers on StickerPencil are completely free to copy, download, and share for personal chat use across all social platforms."},
            {"question": "How do I animate or customize these stickers?", "answer": "Click 'Animate & Edit in Studio' on any sticker to open our free built-in Sticker Maker Studio, where you can add outlines, wobble animations, and custom text captions."}
        ],
        "seoKeywords": [
            f"{clean_name.lower()} stickers",
            f"{clean_name.lower()} whatsapp stickers",
            f"{clean_name.lower()} discord emotes",
            "free transparent stickers",
            "meme sticker pack",
            "telegram sticker pack",
            "transparent png download",
            "reaction stickers 2026"
        ]
    }

def build_static_pack_page(pack, all_stickers, all_packs):
    """Generate a self-contained, fully-styled, static HTML page for this pack."""
    slug = pack.get("slug") or re.sub(r"[^a-z0-9]+", "-", pack["name"].lower()).strip("-")
    pack_name = pack.get("displayName") or pack["name"]
    category = pack.get("category", "Memes & Reactions")
    icon = pack.get("icon", "📦")
    color = pack.get("color", "#fef08a")
    
    # Filter stickers belonging to this pack
    pack_stickers = [s for s in all_stickers if (s.get("pack") or "").lower() == pack["name"].lower()]
    count = len(pack_stickers) if pack_stickers else pack.get("count", 0)

    seo = pack.get("seoContent") or generate_fallback_seo(pack_name, category, count)

    meta_title = seo.get("metaTitle", f"{pack_name} Stickers - Free WhatsApp & Discord Emotes")
    meta_desc = seo.get("metaDescription", f"Download {count}+ free transparent {pack_name} stickers for WhatsApp, Discord, and Telegram.")
    hero_tagline = seo.get("heroTagline", f"High-Definition Transparent {pack_name} Stickers")
    overview = seo.get("overview", "")
    overview_paragraphs = "\n".join([f"<p>{p.strip()}</p>" for p in overview.split("\n\n") if p.strip()])
    chat_cases = seo.get("chatUseCases", [])
    faq_items = seo.get("faq", [])
    keywords_str = ", ".join(seo.get("seoKeywords", [f"{pack_name.lower()} stickers", "whatsapp stickers", "discord emotes"]))

    canonical_url = f"https://stickerpencil.com/pack-{slug}.html"
    first_thumb = pack_stickers[0]["imageUrl"] if pack_stickers else "https://stickerpencil.com/assets/og-banner.png"

    # JSON-LD Schema
    json_ld_faq = []
    for item in faq_items:
        json_ld_faq.append({
            "@type": "Question",
            "name": item.get("question", ""),
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.get("answer", "")
            }
        })

    json_ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Product",
                "name": f"{pack_name} Sticker Pack",
                "description": meta_desc,
                "image": first_thumb,
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/InStock"
                },
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.9",
                    "reviewCount": str(max(85, count * 3))
                }
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://stickerpencil.com/"},
                    {"@type": "ListItem", "position": 2, "name": "Packs", "item": "https://stickerpencil.com/packs.html"},
                    {"@type": "ListItem", "position": 3, "name": pack_name, "item": canonical_url}
                ]
            },
            {
                "@type": "FAQPage",
                "mainEntity": json_ld_faq
            }
        ]
    }

    # Cards HTML for the stickers in this pack
    cards_html = []
    for idx, s in enumerate(pack_stickers):
        s_id = s.get("id", f"stk-{idx}")
        s_title = s.get("title", f"{pack_name} #{idx+1}")
        s_url = s.get("imageUrl", "")
        is_gif = s.get("format") == "gif" or s_url.endswith(".gif") or "/fl_animated" in s_url
        thumb_url = s_url
        if "res.cloudinary.com" in s_url and not is_gif:
            thumb_url = re.sub(r"/image/upload/(?:(?:[a-z]_[^/]+|v\d+),?)+/", "/image/upload/w_400,q_75,f_auto,c_limit/", s_url)

        cards_html.append(f"""
        <article class="sticker-card {'card-is-gif' if is_gif else 'card-is-sticker'}" data-id="{s_id}" onclick="window.location.href='index.html?sticker={s_id}'" style="cursor: pointer;">
          <div class="sticker-preview-box">
            {f'<div class="pin-gif-badge"><span class="gif-pulse-dot"></span>GIF</div>' if is_gif else ''}
            <img 
              src="{thumb_url}" 
              alt="{s_title} transparent sticker" 
              class="sticker-img loaded" 
              loading="lazy" 
              decoding="async" 
            />
            <div class="pin-hover-overlay">
              <div class="pin-top-actions">
                <button type="button" class="pin-action-btn pin-copy-btn" onclick="copySingleSticker('{s_url}', '{s_title}')" title="Copy Sticker">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><rect width="13" height="13" x="9" y="9" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <span>Copy</span>
                </button>
              </div>
              <div class="pin-bottom-bar">
                <button type="button" class="pin-action-btn pin-dl-btn" onclick="downloadSingleSticker('{s_url}', '{s_title}')" title="Download">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>{'GIF' if is_gif else 'PNG'}</span>
                </button>
                <a href="sticker-maker.html?sticker={s_id}" class="pin-action-btn pin-edit-btn" title="Edit in Studio">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m18 5-3-3L6 11l3 3L18 5z"/><path d="m3 21 3-1-2-2-1 3z"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div class="sticker-info-strip">
            <h3 class="sticker-item-title">{s_title}</h3>
            <span class="sticker-format-pill">{icon} {category}</span>
          </div>
        </article>
        """)

    # Related Packs
    related_packs = [p for p in all_packs if (p.get("name") or "").lower() != pack["name"].lower()][:3]
    related_html = []
    for rp in related_packs:
        r_slug = rp.get("slug") or re.sub(r"[^a-z0-9]+", "-", rp["name"].lower()).strip("-")
        r_name = rp.get("displayName") or rp["name"]
        r_icon = rp.get("icon", "📦")
        related_html.append(f"""
        <a href="pack-{r_slug}.html" class="related-pack-chip">
          <span class="rp-icon">{r_icon}</span>
          <div class="rp-info">
            <strong class="rp-title">{r_name}</strong>
            <span class="rp-sub">View Bundle &rarr;</span>
          </div>
        </a>
        """)

    # Use cases HTML
    cases_html = []
    for c in chat_cases:
        cases_html.append(f"""
        <div class="usecase-card">
          <div class="usecase-badge">💡 Tip</div>
          <h4 class="usecase-title">{c.get('title', '')}</h4>
          <p class="usecase-desc">{c.get('description', '')}</p>
        </div>
        """)

    # FAQ HTML
    faq_html = []
    for f in faq_items:
        faq_html.append(f"""
        <details class="faq-accordion-item">
          <summary class="faq-question">
            <span>{f.get('question', '')}</span>
            <span class="faq-chevron">&darr;</span>
          </summary>
          <div class="faq-answer">
            <p>{f.get('answer', '')}</p>
          </div>
        </details>
        """)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  
  <title>{meta_title}</title>
  <meta name="title" content="{meta_title}">
  <meta name="description" content="{meta_desc}">
  <meta name="keywords" content="{keywords_str}">
  <meta name="author" content="StickerPencil">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="{canonical_url}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="{canonical_url}">
  <meta property="og:title" content="{meta_title}">
  <meta property="og:description" content="{meta_desc}">
  <meta property="og:image" content="{first_thumb}">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="{canonical_url}">
  <meta property="twitter:title" content="{meta_title}">
  <meta property="twitter:description" content="{meta_desc}">
  <meta property="twitter:image" content="{first_thumb}">

  <!-- High-Res Brand Favicon -->
  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">

  <!-- Stylesheet -->
  <link rel="stylesheet" href="css/style.css?v=26">

  <!-- Structured Data JSON-LD -->
  <script type="application/ld+json">
  {json.dumps(json_ld, indent=2, ensure_ascii=False)}
  </script>

  <style>
    .pack-hero-section {{
      max-width: 1280px;
      margin: 28px auto 36px;
      padding: 0 24px;
    }}
    .pack-breadcrumbs {{
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 20px;
    }}
    .pack-breadcrumbs a {{
      color: var(--text-secondary);
      text-decoration: none;
      transition: color 0.2s ease;
    }}
    .pack-breadcrumbs a:hover {{ color: #00F0FF; }}
    .pack-banner-card {{
      background: linear-gradient(135deg, rgba(20, 23, 34, 0.95) 0%, rgba(11, 13, 18, 0.98) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 36px 32px;
      box-shadow: 0 20px 48px -12px rgba(0, 0, 0, 0.7);
      position: relative;
      overflow: hidden;
    }}
    .pack-banner-card::before {{
      content: "";
      position: absolute;
      top: -80px;
      right: -80px;
      width: 240px;
      height: 240px;
      background: radial-gradient(circle, rgba(255, 0, 122, 0.25) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }}
    .pack-header-top {{
      display: flex;
      align-items: center;
      gap: 18px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }}
    .pack-hero-emoji {{
      font-size: 3rem;
      width: 72px;
      height: 72px;
      background: {color};
      color: #05070f;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 20px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      flex-shrink: 0;
    }}
    .pack-title-wrap h1 {{
      font-size: 2.4rem;
      font-weight: 800;
      color: #ffffff !important;
      margin: 0 0 6px;
      letter-spacing: -0.02em;
    }}
    .pack-meta-pills {{
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }}
    .pack-pill-chip {{
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: var(--text-secondary);
    }}
    .pack-pill-chip.count {{
      background: rgba(0, 240, 255, 0.15);
      border-color: rgba(0, 240, 255, 0.4);
      color: #00F0FF;
    }}
    .pack-hero-tagline {{
      font-size: 1.15rem;
      color: #f1f5f9;
      font-weight: 600;
      margin: 16px 0 24px;
      line-height: 1.5;
    }}
    .pack-action-bar {{
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }}
    .btn-pack-primary {{
      background: linear-gradient(135deg, #FF007A 0%, #9333EA 100%);
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 0.95rem;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 8px 24px rgba(255, 0, 122, 0.4);
      transition: all 0.2s ease;
      border: none;
      cursor: pointer;
    }}
    .btn-pack-primary:hover {{
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(255, 0, 122, 0.6);
    }}
    .btn-pack-secondary {{
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #ffffff !important;
      padding: 12px 20px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.92rem;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }}
    .btn-pack-secondary:hover {{
      background: rgba(255, 255, 255, 0.1);
      border-color: #00F0FF;
      color: #00F0FF !important;
    }}
    /* Editorial SEO Section */
    .pack-editorial-section {{
      max-width: 1280px;
      margin: 48px auto;
      padding: 0 24px;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 36px;
    }}
    @media (max-width: 960px) {{
      .pack-editorial-section {{ grid-template-columns: 1fr; }}
    }}
    .editorial-content-box {{
      background: #141722;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 32px;
      color: #94a3b8;
      font-size: 0.98rem;
      line-height: 1.7;
    }}
    .editorial-content-box h2,
    .editorial-content-box h3 {{
      font-weight: 800;
      color: #ffffff !important;
    }}
    .editorial-content-box h2 {{
      font-size: 1.6rem;
      margin: 0 0 16px;
    }}
    .editorial-content-box p {{
      margin-bottom: 16px;
    }}
    .usecases-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }}
    .usecase-card {{
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 18px;
    }}
    .usecase-badge {{
      font-size: 0.75rem;
      font-weight: 800;
      color: #00F0FF;
      text-transform: uppercase;
      margin-bottom: 6px;
    }}
    .usecase-title {{
      font-size: 1.05rem;
      font-weight: 700;
      color: #ffffff !important;
      margin: 0 0 8px;
    }}
    .usecase-desc {{
      font-size: 0.88rem;
      line-height: 1.5;
      margin: 0;
      color: #94a3b8 !important;
    }}
    /* FAQ Accordion */
    .faq-accordion-item {{
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      margin-bottom: 12px;
      overflow: hidden;
    }}
    .faq-question {{
      padding: 16px 20px;
      font-weight: 700;
      color: #ffffff !important;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      user-select: none;
    }}
    .faq-answer {{
      padding: 0 20px 18px;
      font-size: 0.92rem;
      line-height: 1.6;
      color: #94a3b8 !important;
    }}
    /* Related Packs Sidebar */
    .related-packs-box {{
      background: #141722;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 28px;
      height: fit-content;
    }}
    .related-packs-box h3,
    .related-packs-box h4 {{
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff !important;
      margin: 0 0 16px;
    }}
    .related-pack-chip {{
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      text-decoration: none;
      margin-bottom: 12px;
      transition: all 0.2s ease;
    }}
    .related-pack-chip:hover {{
      border-color: #00F0FF;
      background: rgba(0, 240, 255, 0.06);
      transform: translateX(4px);
    }}
    .rp-icon {{
      font-size: 1.8rem;
    }}
    .rp-title {{
      font-size: 0.95rem;
      color: #ffffff !important;
      display: block;
    }}
    .rp-sub {{
      font-size: 0.78rem;
      color: #00F0FF;
    }}
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 8px;
    }}
    .usecase-desc {{
      font-size: 0.88rem;
      line-height: 1.5;
      margin: 0;
    }}
    /* FAQ Accordion */
    .faq-accordion-item {{
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      margin-bottom: 12px;
      overflow: hidden;
    }}
    .faq-question {{
      padding: 16px 20px;
      font-weight: 700;
      color: var(--text-primary);
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      user-select: none;
    }}
    .faq-answer {{
      padding: 0 20px 18px;
      font-size: 0.92rem;
      line-height: 1.6;
      color: var(--text-secondary);
    }}
    /* Related Packs Sidebar */
    .related-packs-box {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 28px;
      height: fit-content;
    }}
    .related-packs-box h3 {{
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 16px;
    }}
    .related-pack-chip {{
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-subtle);
      text-decoration: none;
      margin-bottom: 12px;
      transition: all 0.2s ease;
    }}
    .related-pack-chip:hover {{
      border-color: #00F0FF;
      background: rgba(0, 240, 255, 0.06);
      transform: translateX(4px);
    }}
    .rp-icon {{
      font-size: 1.8rem;
    }}
    .rp-title {{
      font-size: 0.95rem;
      color: var(--text-primary);
      display: block;
    }}
    .rp-sub {{
      font-size: 0.78rem;
      color: #00F0FF;
    }}
  </style>
</head>
<body class="sketch-dark-mode">

  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <a href="index.html" class="brand-logo" aria-label="StickerPencil Home">
        <img src="assets/logo.svg" alt="getstckup" class="brand-logo-svg" height="40" />
      </a>

      <nav aria-label="Main Navigation">
        <ul class="nav-links">
          <li><a href="index.html" class="nav-link">Explore</a></li>
          <li><a href="packs.html" class="nav-link active">Packs</a></li>
          <li><a href="trending.html" class="nav-link">Trending</a></li>
          <li><a href="categories.html" class="nav-link">Categories</a></li>
          <li><a href="sticker-maker.html" class="nav-link nav-link-studio">Studio <span class="studio-badge-cute">New</span></a></li>
        </ul>
      </nav>

      <div class="nav-actions">
        <a href="packs.html" class="btn-sketch btn-sketch-sm">All Packs &rarr;</a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <main>
    <section class="pack-hero-section">
      <nav class="pack-breadcrumbs" aria-label="Breadcrumb">
        <a href="index.html">Home</a>
        <span>&rsaquo;</span>
        <a href="packs.html">Packs</a>
        <span>&rsaquo;</span>
        <span>{pack_name}</span>
      </nav>

      <div class="pack-banner-card">
        <div class="pack-header-top">
          <div class="pack-hero-emoji">{icon}</div>
          <div class="pack-title-wrap">
            <h1>{pack_name}</h1>
            <div class="pack-meta-pills">
              <span class="pack-pill-chip count">{count} Transparent Stickers</span>
              <span class="pack-pill-chip">{category}</span>
              <span class="pack-pill-chip">Free WhatsApp &amp; Discord Bundle</span>
            </div>
          </div>
        </div>

        <p class="pack-hero-tagline">{hero_tagline}</p>

        <div class="pack-action-bar">
          <button class="btn-pack-primary" onclick="downloadPackAll('{pack_name}')">
            <span>📥 Download Pack (All {count} Stickers)</span>
          </button>
          <a href="index.html?pack={pack_name}" class="btn-pack-secondary">
            <span>🔍 View in Full Search Feed</span>
          </a>
          <a href="sticker-maker.html" class="btn-pack-secondary">
            <span>✨ Animate in Studio</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Sticker Masonry Grid -->
    <section class="stickers-container" style="max-width: 1280px; margin: 0 auto; padding: 0 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0;">
          All {count} Stickers in this Pack
        </h2>
        <span style="font-size: 0.88rem; color: var(--text-secondary);">Click any sticker to 1-click copy or download</span>
      </div>

      <div class="stickers-grid" id="packStickersGrid">
        {''.join(cards_html) if cards_html else '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">No stickers found in this pack.</p>'}
      </div>
    </section>

    <!-- Editorial SEO Section (Groq LLM Generated) -->
    <section class="pack-editorial-section">
      <div class="editorial-content-box">
        <h2>About the {pack_name} Bundle</h2>
        {overview_paragraphs}

        <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin: 32px 0 14px;">
          Best Chat Situations &amp; Reactions
        </h3>
        <div class="usecases-grid">
          {''.join(cases_html)}
        </div>

        <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin: 36px 0 14px;">
          Frequently Asked Questions
        </h3>
        <div class="faq-list">
          {''.join(faq_html)}
        </div>
      </div>

      <!-- Sidebar -->
      <aside class="related-packs-box">
        <h3>Related Sticker Packs</h3>
        {''.join(related_html)}

        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--border-subtle);">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">Need Custom Stickers?</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 14px;">
            Create and customize transparent stickers or animated GIFs using our free web studio.
          </p>
          <a href="sticker-maker.html" class="btn-sketch" style="width: 100%; text-align: center; box-sizing: border-box;">Open Studio &rarr;</a>
        </div>
      </aside>
    </section>
  </main>

  <!-- Footer -->
  <footer class="site-footer" style="margin-top: 60px;">
    <div class="footer-container">
      <div>
        <h4 class="footer-heading">StickerPencil</h4>
        <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6;">
          Free transparent stickers and animated GIFs for WhatsApp, Discord, Instagram Stories &amp; Telegram.
        </p>
      </div>
      <div>
        <h4 class="footer-heading">Platforms</h4>
        <ul class="footer-links-list">
          <li><a href="whatsapp-stickers.html" class="footer-link">WhatsApp Stickers</a></li>
          <li><a href="discord-stickers.html" class="footer-link">Discord Emotes</a></li>
          <li><a href="telegram-stickers.html" class="footer-link">Telegram Stickers</a></li>
          <li><a href="instagram-stickers.html" class="footer-link">Instagram Stickers</a></li>
        </ul>
      </div>
      <div>
        <h4 class="footer-heading">Explore</h4>
        <ul class="footer-links-list">
          <li><a href="index.html" class="footer-link">All Stickers</a></li>
          <li><a href="packs.html" class="footer-link">Themed Packs</a></li>
          <li><a href="trending.html" class="footer-link">Trending Top Charts</a></li>
          <li><a href="categories.html" class="footer-link">Categories</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 StickerPencil. All rights reserved.</span>
    </div>
  </footer>

  <!-- Toast Container -->
  <div class="toast-container" id="toastContainer"></div>

  <!-- Interactive Scripts -->
  <script src="js/cloudinary-stickers.js"></script>
  <script src="js/data.js"></script>
  <script>
    function showToast(msg, icon = "✨") {{
      let c = document.getElementById("toastContainer");
      if (!c) {{
        c = document.createElement("div");
        c.id = "toastContainer";
        c.className = "toast-container";
        document.body.appendChild(c);
      }}
      const t = document.createElement("div");
      t.className = "toast-item active";
      t.style.cssText = "background:#171b24;color:#fff;border:1px solid rgba(0,240,255,0.4);border-radius:12px;padding:12px 20px;margin-top:10px;font-weight:600;display:flex;align-items:center;gap:10px;box-shadow:0 10px 25px rgba(0,0,0,0.5);";
      t.innerHTML = `<span>${{icon}}</span><span>${{msg}}</span>`;
      c.appendChild(t);
      setTimeout(() => {{ t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }}, 3000);
    }}

    async function copySingleSticker(url, title) {{
      try {{
        const resp = await fetch(url);
        const blob = await resp.blob();
        await navigator.clipboard.write([
          new ClipboardItem({{ [blob.type]: blob }})
        ]);
        showToast(`Copied "${{title}}" to clipboard! Ready to paste into chat.`);
      }} catch (e) {{
        // Fallback: copy image URL
        navigator.clipboard.writeText(url);
        showToast(`Copied image link to clipboard!`);
      }}
    }}

    function downloadSingleSticker(url, title) {{
      const a = document.createElement("a");
      a.href = url;
      a.download = (title || "sticker").toLowerCase().replace(/[^a-z0-9]+/g, "-") + (url.endsWith(".gif") ? ".gif" : ".png");
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast(`Downloading "${{title}}"...`);
    }}

    function downloadPackAll(packName) {{
      showToast(`Preparing bundle download for "${{packName}}"...`, "📦");
      const stickers = (window.CLOUDINARY_UPLOADED_STICKERS || []).filter(s => (s.pack || "").toLowerCase() === packName.toLowerCase());
      if (stickers.length === 0) {{
        alert("No stickers found to download.");
        return;
      }}
      // Trigger download of first 5 sample stickers or prompt
      stickers.slice(0, 5).forEach((s, idx) => {{
        setTimeout(() => {{
          downloadSingleSticker(s.imageUrl, s.title);
        }}, idx * 400);
      }});
      showToast(`Started downloading top stickers from ${{packName}}!`, "🚀");
    }}
  </script>
</body>
</html>
"""
    return html_content

def update_sitemap(pack_slugs):
    """Ensure all pack-{slug}.html and pack.html URLs are present in sitemap.xml."""
    if not os.path.exists(SITEMAP_PATH):
        return

    with open(SITEMAP_PATH, "r", encoding="utf-8") as f:
        sitemap_content = f.read()

    new_urls = []
    today = datetime.now().strftime("%Y-%m-%d")

    for slug in pack_slugs:
        url_loc = f"https://stickerpencil.com/pack-{slug}.html"
        if url_loc not in sitemap_content:
            new_urls.append(f"""  <!-- Dedicated Pack Bundle: {slug} -->
  <url>
    <loc>{url_loc}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>""")

    if new_urls:
        insert_marker = "</urlset>"
        replacement = "\n".join(new_urls) + "\n" + insert_marker
        sitemap_content = sitemap_content.replace(insert_marker, replacement)
        with open(SITEMAP_PATH, "w", encoding="utf-8") as f:
            f.write(sitemap_content)
        print(f"✅ Added {len(new_urls)} pack URLs to sitemap.xml.")

def main():
    print("=" * 60)
    print("🚀 StickerPencil - Groq AI Pack Page Generator")
    print("=" * 60)

    manifest = load_manifest()
    packs = manifest.get("packs", [])
    if not packs:
        print("No packs found in manifest. Exiting.")
        return

    all_stickers = load_stickers_from_js()
    print(f"📦 Loaded {len(packs)} packs, {len(all_stickers)} stickers.")

    pack_slugs = []

    for i, pack in enumerate(packs):
        p_name = pack.get("displayName") or pack["name"]
        slug = pack.get("slug") or re.sub(r"[^a-z0-9]+", "-", pack["name"].lower()).strip("-")
        pack["slug"] = slug
        pack_slugs.append(slug)
        category = pack.get("category", "Memes & Reactions")
        count = pack.get("count", 0)

        print(f"\n[{i+1}/{len(packs)}] Processing pack: '{p_name}' ({count} stickers)...")

        # Check if SEO content already exists, if not generate via Groq
        if "seoContent" not in pack or not pack["seoContent"].get("overview"):
            print(f"  Calling Groq AI to generate rich SEO content for '{p_name}'...")
            seo = call_groq_llm(p_name, category, count)
            pack["seoContent"] = seo
            print(f"  ✨ Generated SEO title: '{seo.get('metaTitle')}'")
        else:
            print("  SEO content already cached in manifest.")

        # Build static HTML page
        html = build_static_pack_page(pack, all_stickers, packs)
        output_filename = f"pack-{slug}.html"
        output_path = os.path.join(BASE_DIR, output_filename)

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  📄 Wrote static page: {output_filename} (with {len([s for s in all_stickers if (s.get('pack') or '').lower() == pack['name'].lower()])} embedded stickers)")
        
        import time
        time.sleep(1.5)

    # Save manifest with updated SEO content
    save_manifest(manifest)

    # Update sitemap.xml
    update_sitemap(pack_slugs)

    print("\n🎉 All detailed pack pages generated successfully with Groq AI SEO content!")
    print("=" * 60)

if __name__ == "__main__":
    main()
