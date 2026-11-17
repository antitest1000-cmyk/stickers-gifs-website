# ✏️ StickerPencil - Sketchy & Pencil Style Cross-Platform Sticker Hub

A minimalist, hand-drawn, graphite notebook-style sticker discovery platform and management studio. Built with pure **HTML5, CSS3, and modern Vanilla JavaScript**.

Designed specifically for creators to discover, 1-click copy, and download transparent stickers for **WhatsApp, Discord, Instagram Stories, Snapchat, Reddit, and Telegram**, all backed by **Cloudinary CDN**.

---

## 🎨 The "Silmestic & Pencil" Aesthetic

- **Hand-drawn Notebook Feel**: Subtle ruled/dotted paper background texture, faint red left margin line, graphite `#1c1917` charcoal strokes.
- **Sketch Borders**: Multi-angle organic `border-radius` corners and offset charcoal box-shadows.
- **Handwritten Typography**: Google Fonts (`Patrick Hand` paired with `Plus Jakarta Sans` and `Space Mono`).
- **Interactive Details**: Wobble effects, scotch tape badge corners, highlighter pastel accents, and dark sketchbook mode.

---

## 🚀 Key Features

1. **1-Click Native Clipboard Copy**:
   - Copies real transparent PNG blobs directly into the system clipboard via `navigator.clipboard.write([new ClipboardItem({'image/png': blob})])`.
   - Users can press `Ctrl+V` directly into WhatsApp Web, Discord chat, Slack, or Reddit comments!
2. **Cloudinary CDN Integration**:
   - Dynamic URL builder automatically injects `f_auto,q_auto,w_400,c_limit` for minimal bandwidth and instantaneous load times.
   - Built-in Cloudinary Upload Widget in the Admin Panel.
3. **Admin Studio (`admin.html`)**:
   - PIN-protected studio (Default PIN: `1234` or `admin123`).
   - Add new stickers with live transparency checkerboard preview.
   - Multi-platform checkboxes, category selector, tags, and pack assignments.
   - Edit, delete, and toggle "Top Pick" status.
   - **JSON Sync**: 1-click export of `stickers-data.json` to commit back to your Git repo for permanent hardcoding.
4. **Curated Sticker Packs & Auto-Detector (`packs.html`)**:
   - Themed packs ("Cats Hinglish Doodles", "Jolochip Phuyawrr", "Desi Hinglish Viral", "Doggo Memes", etc.).
   - **⚡ Automatic Cloudinary Pack Detector**: When you upload a new pack folder to Cloudinary, the website automatically detects it, creates a dedicated pack card with custom theme colors and icons, and displays all stickers inside it.
   - 1-click batch download and 1-click direct filtered viewing.
5. **Continuous Cloudinary Sync Tools**:
   - `python sync_cloudinary.py` (or `node sync_cloudinary.js`): Scans your sticker folders, tests Cloudinary CDN availability, and updates the site database in seconds.
   - `python sync_cloudinary.py --watch`: Background watcher that automatically picks up any new pack uploaded to Cloudinary!
5. **SEO Powerhouse & Guides (`how-to-use.html`)**:
   - Dedicated cheatsheets for WhatsApp Web, WhatsApp Mobile (Sticker.ly), Discord server emojis, Instagram Story photo stickers, Snapchat camera roll stickers, and Telegram `@Stickers` bot.
   - Rich JSON-LD `WebSite`, `HowTo`, and `SearchAction` schema.

---

## ☁️ Cloudinary Free Setup (3 Easy Steps)

1. Sign up for a free account at [Cloudinary](https://cloudinary.com/) (free tier gives 25GB/month bandwidth, plenty for hundreds of thousands of stickers).
2. Go to **Settings > Upload** > scroll down to **Upload presets** > click **Add upload preset**.
3. Set the Signing Mode to **Unsigned**, name it (e.g. `stickers_preset`), and save.
4. In StickerPencil Admin (`admin.html`), enter your **Cloud Name** and **Upload Preset**.

---

## 📁 Project Architecture

```
new sticker website/
├── index.html            # Main discovery explorer & search
├── packs.html            # Themed sticker collections
├── how-to-use.html       # High-SEO platform usage guides
├── admin.html            # Admin dashboard (CRUD & Cloudinary)
├── css/
│   ├── style.css         # Pencil/sketch design system tokens
│   └── admin.css         # Sketchy admin studio styling
├── js/
│   ├── data.js           # Seed database & Cloudinary helpers
│   ├── app.js            # Search, filter, modal & 1-click copy
│   └── admin.js          # Admin dashboard controller & JSON sync
├── robots.txt            # Search engine crawler instructions
├── sitemap.xml           # XML sitemap for Google indexing
└── README.md             # Documentation
```

---

## 🌐 Instant Local Preview

Simply double-click `index.html` to open it in any web browser, or serve it with Python/Node:

```bash
# Python 3
python -m http.server 8080

# Or npx serve
npx serve .
```

