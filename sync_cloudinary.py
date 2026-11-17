"""
STICKERPENCIL - CLOUDINARY AUTO-DETECTION & PACK SYNC ENGINE
Automatically detects newly uploaded packs on Cloudinary from local folders or Cloudinary CDN,
generates pack metadata, and creates/updates js/cloudinary-stickers.js and data/packs-manifest.json.
"""

import os
import sys
import json
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

CLOUD_NAME = "iyh1dd7y"
STICKERS_SOURCE_DIR = r"C:\Users\antri\Downloads\stickers"
PROJECT_DIR = r"c:\Users\antri\OneDrive\Desktop\new sticker website"
STICKERS_JS_PATH = os.path.join(PROJECT_DIR, "js", "cloudinary-stickers.js")
DATA_DIR = os.path.join(PROJECT_DIR, "data")
MANIFEST_PATH = os.path.join(DATA_DIR, "packs-manifest.json")

# Known folder name to pack name & category mapping
FOLDER_PACK_MAPPING = {
    "cats hinglish stickers": ("Cats Hinglish Doodles", "Cute & Animals", "🐱", "#fef08a", "Hilarious desi cat memes, grumpy kitties, and relatable Hinglish expressions."),
    "cute kids stickers": ("Cute Kids & Babies", "Cute & Animals", "👶", "#fbcfe8", "Adorable baby reactions, chubby cheek smiles, dramatic cries, and wholesome mood-lifters."),
    "dog stikcers": ("Doggo Memes & Reactions", "Cute & Animals", "🐶", "#fed7aa", "Wholesome pups, chaotic doggos, side-eye hounds, and funny canine reactions."),
    "hinglish new": ("Desi Hinglish Viral", "Memes & Reactions", "🔥", "#bae6fd", "The freshest viral desi memes, snappy one-liners, and trending Bollywood Hinglish banter."),
    "hinglish stickers": ("Hinglish Classics", "Memes & Reactions", "💬", "#bbf7d0", "Timeless Hindi-English dialogues, bakchodi stickers, and mood-defining chat reactions."),
    "silly stickers": ("Silly Goofs & Brainrot", "Memes & Reactions", "🤪", "#e0e7ff", "Chaotic energy, derpy faces, weird animals, and peak brainrot internet humor."),
    "westren stickers": ("Western Pop & Aesthetic", "Trending & Aesthetic", "✨", "#f5d0fe", "Retro Western pop culture, vintage cowboy vibes, trendy cartoon icons, and pastel doodles."),
    "for divas": ("For Divas & Queens", "Trending & Aesthetic", "💅", "#f472b6", "Fabulous diva expressions, slay attitudes, high-glam vibes, and iconic queen chat reactions."),
    "jolochipphuyawrr": ("Jolochip Phuyawrr", "Memes & Reactions", "🌶️", "#fecaca", "Ultra spicy Jolochip challenge reactions, screaming faces, fire expressions, and wild meme banter."),
    "jolo chip": ("Jolochip Phuyawrr", "Memes & Reactions", "🌶️", "#fecaca", "Ultra spicy Jolochip challenge reactions, screaming faces, fire expressions, and wild meme banter.")
}

def clean_pack_title(folder_name):
    low = folder_name.strip().lower()
    if low in FOLDER_PACK_MAPPING:
        return FOLDER_PACK_MAPPING[low][0]
    # Check partial
    for k, v in FOLDER_PACK_MAPPING.items():
        if k in low or low in k:
            return v[0]
    # Format cleanly from kebab or underscore or raw string
    cleaned = re.sub(r'[-_]+', ' ', folder_name).strip()
    # Title case
    return ' '.join(word.capitalize() for word in cleaned.split())

def detect_metadata(pack_name):
    low = pack_name.lower()
    for k, v in FOLDER_PACK_MAPPING.items():
        if k in low or v[0].lower() in low:
            return v[1], v[2], v[3], v[4]
    
    # Defaults based on keywords
    if any(w in low for w in ["cat", "dog", "puppy", "kitten", "animal", "pet", "baby", "kid"]):
        return "Cute & Animals", "🐱" if "cat" in low else "🐶" if "dog" in low else "👶", "#fef08a", f"Curated transparent {pack_name} collection."
    elif any(w in low for w in ["anime", "manga", "waifu"]):
        return "Anime & Gaming", "🌸", "#f5d0fe", f"Epic {pack_name} stickers for Discord & Telegram."
    elif any(w in low for w in ["jolo", "chip", "chili", "hot", "fire", "spicy"]):
        return "Memes & Reactions", "🌶️", "#fecaca", f"Spicy {pack_name} challenge memes and hot reaction stickers."
    elif any(w in low for w in ["meme", "funny", "reaction", "brainrot"]):
        return "Memes & Reactions", "🔥", "#bae6fd", f"Trending {pack_name} reactions and chat memes."
    else:
        return "Memes & Reactions", "📦", "#e0e7ff", f"Curated {pack_name} sticker pack for all platforms."

def verify_cloudinary_asset(pub_id):
    url = f"https://res.cloudinary.com/{CLOUD_NAME}/image/upload/q_auto,w_400/{pub_id}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        res = urllib.request.urlopen(req, timeout=4)
        return (pub_id, res.status == 200)
    except:
        return (pub_id, False)

def load_existing_stickers():
    if not os.path.exists(STICKERS_JS_PATH):
        return []
    with open(STICKERS_JS_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    # Extract JSON inside const CLOUDINARY_UPLOADED_STICKERS = [...];
    match = re.search(r'const\s+CLOUDINARY_UPLOADED_STICKERS\s*=\s*(\[[\s\S]*?\])\s*;?\s*$', content)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception as e:
            print(f"Error parsing existing JSON: {e}")
    return []

def save_stickers_js(stickers):
    header = f"// CLOUDINARY REAL USER UPLOADS ({len(stickers)} STICKERS)\n"
    content = header + "const CLOUDINARY_UPLOADED_STICKERS = " + json.dumps(stickers, indent=2, ensure_ascii=False) + ";\n"
    with open(STICKERS_JS_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ Successfully wrote {len(stickers)} stickers to {STICKERS_JS_PATH}")

def update_manifest(stickers):
    os.makedirs(DATA_DIR, exist_ok=True)
    packs_dict = {}
    for s in stickers:
        pack = s.get("pack", "General")
        if pack not in packs_dict:
            cat, icon, color, desc = detect_metadata(pack)
            packs_dict[pack] = {
                "name": pack,
                "category": cat,
                "icon": icon,
                "color": color,
                "description": desc,
                "slug": re.sub(r'[^a-z0-9]+', '-', pack.lower()).strip('-'),
                "count": 0,
                "sampleImages": []
            }
        packs_dict[pack]["count"] += 1
        if len(packs_dict[pack]["sampleImages"]) < 6:
            packs_dict[pack]["sampleImages"].append(s.get("imageUrl"))

    manifest = {
        "cloudName": CLOUD_NAME,
        "lastUpdated": time.strftime("%Y-%m-%d %H:%M:%S"),
        "totalStickers": len(stickers),
        "totalPacks": len(packs_dict),
        "packs": list(packs_dict.values())
    }

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"✅ Updated packs manifest: {MANIFEST_PATH} with {len(packs_dict)} packs.")

def sync_folders():
    if not os.path.exists(STICKERS_SOURCE_DIR):
        print(f"Stickers source directory not found: {STICKERS_SOURCE_DIR}")
        return

    existing_stickers = load_existing_stickers()
    existing_urls = {s.get("imageUrl"): True for s in existing_stickers}
    existing_packs = {s.get("pack"): True for s in existing_stickers}

    print(f"Currently loaded: {len(existing_stickers)} stickers across {len(existing_packs)} packs.")

    folders = os.listdir(STICKERS_SOURCE_DIR)
    new_stickers = []

    for folder in folders:
        folder_path = os.path.join(STICKERS_SOURCE_DIR, folder)
        if not os.path.isdir(folder_path):
            continue

        pack_name = clean_pack_title(folder)
        category, icon, color, desc = detect_metadata(pack_name)

        files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
        if not files:
            continue

        # Check which files from this folder are already synced
        unseen_files = []
        for f in files:
            pub_id = os.path.splitext(f)[0]
            url = f"https://res.cloudinary.com/{CLOUD_NAME}/image/upload/q_auto,w_400/{pub_id}"
            if url not in existing_urls:
                unseen_files.append((pub_id, f))

        if not unseen_files:
            print(f"Pack '{pack_name}' ({len(files)} items) already fully synced.")
            continue

        print(f"🔍 Found new/unregistered pack folder: '{folder}' -> Target Pack: '{pack_name}' with {len(unseen_files)} new files.")
        print(f"   Verifying live Cloudinary CDN presence for '{pack_name}'...")

        # Fast parallel check against Cloudinary
        pub_ids = [p[0] for p in unseen_files]
        with ThreadPoolExecutor(max_workers=20) as executor:
            check_results = list(executor.map(verify_cloudinary_asset, pub_ids))

        valid_ids = {pid: ok for pid, ok in check_results if ok}
        print(f"   Cloudinary check result: {len(valid_ids)}/{len(pub_ids)} verified live on Cloudinary CDN!")

        if not valid_ids:
            print(f"   ⚠️ None of the files for '{folder}' were found on Cloudinary {CLOUD_NAME}. Ensure they are uploaded.")
            continue

        # Build sticker items
        idx = 1
        for pub_id, fname in unseen_files:
            if pub_id not in valid_ids:
                continue

            clean_tag = re.sub(r'[^a-zA-Z0-9]+', ' ', pack_name).lower().split()
            tags = list(set(clean_tag + ["sticker", "transparent", "reaction", f"#{idx}"]))

            sticker_item = {
                "id": f"cly-{pub_id[:8]}",
                "title": f"{pack_name} #{idx}",
                "imageUrl": f"https://res.cloudinary.com/{CLOUD_NAME}/image/upload/q_auto,w_400/{pub_id}",
                "category": category,
                "platforms": ["whatsapp", "discord", "instagram", "telegram", "reddit", "snapchat"],
                "tags": tags,
                "pack": pack_name,
                "featured": idx <= 8,
                "downloads": 40 + (idx * 3) % 95,
                "createdAt": time.strftime("%Y-%m-%d")
            }
            new_stickers.append(sticker_item)
            existing_urls[sticker_item["imageUrl"]] = True
            idx += 1

        print(f"   🎉 Created pack '{pack_name}' with {len(valid_ids)} stickers!")

    if new_stickers:
        merged = existing_stickers + new_stickers
        save_stickers_js(merged)
        update_manifest(merged)
        print(f"\n🚀 ALL DONE! Added {len(new_stickers)} new stickers. Total stickers now: {len(merged)}.")
    else:
        print("\n✨ All packs are already up to date with Cloudinary.")
        update_manifest(existing_stickers)

if __name__ == "__main__":
    if "--watch" in sys.argv:
        print("👀 Starting Cloudinary Folder Watcher... (Press Ctrl+C to stop)")
        while True:
            try:
                sync_folders()
                time.sleep(10)
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Watcher error: {e}")
                time.sleep(10)
    else:
        sync_folders()
