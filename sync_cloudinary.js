/**
 * STICKERPENCIL - CLOUDINARY AUTO-DETECTION & PACK SYNC ENGINE (NODE.JS)
 * Automatically detects newly uploaded packs on Cloudinary from local folders or Cloudinary CDN,
 * generates pack metadata, and updates js/cloudinary-stickers.js and data/packs-manifest.json.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CLOUD_NAME = 'iyh1dd7y';
const STICKERS_SOURCE_DIR = 'C:\\Users\\antri\\Downloads\\stickers';
const PROJECT_DIR = path.resolve(__dirname);
const STICKERS_JS_PATH = path.join(PROJECT_DIR, 'js', 'cloudinary-stickers.js');
const DATA_DIR = path.join(PROJECT_DIR, 'data');
const MANIFEST_PATH = path.join(DATA_DIR, 'packs-manifest.json');

const FOLDER_PACK_MAPPING = {
  'cats hinglish stickers': ['Cats Hinglish Doodles', 'Cute & Animals', '🐱', '#fef08a', 'Hilarious desi cat memes, grumpy kitties, and relatable Hinglish expressions.'],
  'cute kids stickers': ['Cute Kids & Babies', 'Cute & Animals', '👶', '#fbcfe8', 'Adorable baby reactions, chubby cheek smiles, dramatic cries, and wholesome mood-lifters.'],
  'dog stikcers': ['Doggo Memes & Reactions', 'Cute & Animals', '🐶', '#fed7aa', 'Wholesome pups, chaotic doggos, side-eye hounds, and funny canine reactions.'],
  'hinglish new': ['Desi Hinglish Viral', 'Memes & Reactions', '🔥', '#bae6fd', 'The freshest viral desi memes, snappy one-liners, and trending Bollywood Hinglish banter.'],
  'hinglish stickers': ['Hinglish Classics', 'Memes & Reactions', '💬', '#bbf7d0', 'Timeless Hindi-English dialogues, bakchodi stickers, and mood-defining chat reactions.'],
  'silly stickers': ['Silly Goofs & Brainrot', 'Memes & Reactions', '🤪', '#e0e7ff', 'Chaotic energy, derpy faces, weird animals, and peak brainrot internet humor.'],
  'westren stickers': ['Western Pop & Aesthetic', 'Trending & Aesthetic', '✨', '#f5d0fe', 'Retro Western pop culture, vintage cowboy vibes, trendy cartoon icons, and pastel doodles.'],
  'for divas': ['For Divas & Queens', 'Trending & Aesthetic', '💅', '#f472b6', 'Fabulous diva expressions, slay attitudes, high-glam vibes, and iconic queen chat reactions.'],
  'jolochipphuyawrr': ['Jolochip Phuyawrr', 'Memes & Reactions', '🌶️', '#fecaca', 'Ultra spicy Jolochip challenge reactions, screaming faces, fire expressions, and wild meme banter.'],
  'jolo chip': ['Jolochip Phuyawrr', 'Memes & Reactions', '🌶️', '#fecaca', 'Ultra spicy Jolochip challenge reactions, screaming faces, fire expressions, and wild meme banter.']
};

function cleanPackTitle(folderName) {
  const low = folderName.trim().toLowerCase();
  if (FOLDER_PACK_MAPPING[low]) return FOLDER_PACK_MAPPING[low][0];
  for (const [k, v] of Object.entries(FOLDER_PACK_MAPPING)) {
    if (k.includes(low) || low.includes(k)) return v[0];
  }
  const cleaned = folderName.replace(/[-_]+/g, ' ').trim();
  return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function detectMetadata(packName) {
  const low = packName.toLowerCase();
  for (const [k, v] of Object.entries(FOLDER_PACK_MAPPING)) {
    if (k.includes(low) || v[0].toLowerCase().includes(low)) {
      return { category: v[1], icon: v[2], color: v[3], desc: v[4] };
    }
  }
  if (/(cat|billi|kitty)/i.test(low)) return { category: 'Cute & Animals', icon: '🐱', color: '#fef08a', desc: `Cute ${packName} stickers.` };
  if (/(dog|puppy|hound)/i.test(low)) return { category: 'Cute & Animals', icon: '🐶', color: '#fed7aa', desc: `Fun ${packName} stickers.` };
  if (/(baby|kid|child)/i.test(low)) return { category: 'Cute & Animals', icon: '👶', color: '#fbcfe8', desc: `Wholesome ${packName} stickers.` };
  if (/(jolo|chip|hot|spice|chili)/i.test(low)) return { category: 'Memes & Reactions', icon: '🌶️', color: '#fecaca', desc: `Spicy ${packName} memes & reactions.` };
  if (/(anime|manga)/i.test(low)) return { category: 'Anime & Gaming', icon: '🌸', color: '#f5d0fe', desc: `Vibrant ${packName} anime emotes.` };
  return { category: 'Memes & Reactions', icon: '📦', color: '#e0e7ff', desc: `Curated ${packName} stickers for all chat platforms.` };
}

function verifyAsset(pubId) {
  return new Promise((resolve) => {
    const url = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,w_400/${pubId}`;
    const req = https.request(url, { method: 'HEAD', timeout: 4000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

async function run() {
  console.log(`\n🔍 Checking sticker source directory: ${STICKERS_SOURCE_DIR}...`);
  if (!fs.existsSync(STICKERS_SOURCE_DIR)) {
    console.error(`Directory not found: ${STICKERS_SOURCE_DIR}`);
    return;
  }

  // Load existing stickers
  let existingStickers = [];
  if (fs.existsSync(STICKERS_JS_PATH)) {
    const code = fs.readFileSync(STICKERS_JS_PATH, 'utf8');
    const match = code.match(/const\s+CLOUDINARY_UPLOADED_STICKERS\s*=\s*(\[[\s\S]*?\])\s*;?\s*$/);
    if (match) {
      try { existingStickers = JSON.parse(match[1]); } catch(e) {}
    }
  }

  const existingUrls = new Set(existingStickers.map(s => s.imageUrl));
  console.log(`Currently loaded: ${existingStickers.length} stickers.`);

  const folders = fs.readdirSync(STICKERS_SOURCE_DIR);
  const newStickers = [];

  for (const folder of folders) {
    const folderPath = path.join(STICKERS_SOURCE_DIR, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const packName = cleanPackTitle(folder);
    const meta = detectMetadata(packName);

    const files = fs.readdirSync(folderPath).filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
    if (!files.length) continue;

    const unseenFiles = files.filter(f => {
      const pubId = path.parse(f).name;
      const isGif = f.toLowerCase().endsWith('.gif');
      const url = isGif
        ? `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/fl_animated/${pubId}.gif`
        : `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,w_400/${pubId}`;
      return !existingUrls.has(url);
    });

    if (!unseenFiles.length) {
      console.log(`Pack '${packName}' (${files.length} items) already fully synced.`);
      continue;
    }

    console.log(`\n📦 Found unregistered pack '${folder}' -> Target: '${packName}' (${unseenFiles.length} new files).`);
    console.log(`   Verifying on Cloudinary CDN (${CLOUD_NAME})...`);

    // Batch verify
    let verifiedCount = 0;
    let idx = 1;
    for (const f of unseenFiles) {
      const pubId = path.parse(f).name;
      const isGif = f.toLowerCase().endsWith('.gif');
      const ok = await verifyAsset(pubId);
      if (ok) {
        verifiedCount++;
        const cleanTag = packName.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);
        const extraTags = isGif ? ['gif', 'animated'] : [];
        const tags = Array.from(new Set([...cleanTag, 'sticker', 'transparent', 'reaction', ...extraTags, `#${idx}`]));
        const item = {
          id: `cly-${pubId.slice(0, 8)}`,
          title: `${packName} #${idx}`,
          imageUrl: isGif
            ? `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/fl_animated/${pubId}.gif`
            : `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,w_400/${pubId}`,
          category: meta.category,
          platforms: ['whatsapp', 'discord', 'instagram', 'telegram', 'reddit', 'snapchat'],
          tags: tags,
          pack: packName,
          format: isGif ? 'gif' : 'png',
          isAnimated: isGif,
          featured: idx <= 8,
          downloads: 40 + (idx * 3) % 95,
          createdAt: new Date().toISOString().split('T')[0]
        };
        newStickers.push(item);
        existingUrls.add(item.imageUrl);
        idx++;
      }
    }

    console.log(`   ✅ Verified ${verifiedCount}/${unseenFiles.length} live on Cloudinary!`);
  }

  if (newStickers.length > 0) {
    const merged = existingStickers.concat(newStickers);
    const fileHeader = `// CLOUDINARY REAL USER UPLOADS (${merged.length} STICKERS)\n`;
    fs.writeFileSync(STICKERS_JS_PATH, fileHeader + `const CLOUDINARY_UPLOADED_STICKERS = ${JSON.stringify(merged, null, 2)};\n`, 'utf8');
    console.log(`\n🎉 Saved ${merged.length} stickers to js/cloudinary-stickers.js!`);
  } else {
    console.log(`\n✨ All packs are already up to date.`);
  }

  // Update manifest
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const allStickers = newStickers.length ? existingStickers.concat(newStickers) : existingStickers;
  const packsMap = {};
  allStickers.forEach(s => {
    const p = s.pack || 'General';
    if (!packsMap[p]) {
      const meta = detectMetadata(p);
      packsMap[p] = {
        name: p,
        category: meta.category,
        icon: meta.icon,
        color: meta.color,
        description: meta.desc,
        slug: p.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        count: 0,
        sampleImages: []
      };
    }
    packsMap[p].count++;
    if (packsMap[p].sampleImages.length < 6) {
      packsMap[p].sampleImages.push(s.imageUrl);
    }
  });

  const manifest = {
    cloudName: CLOUD_NAME,
    lastUpdated: new Date().toISOString(),
    totalStickers: allStickers.length,
    totalPacks: Object.keys(packsMap).length,
    packs: Object.values(packsMap)
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`✅ Manifest saved to data/packs-manifest.json (${manifest.totalPacks} packs, ${manifest.totalStickers} stickers).\n`);
}

run();

