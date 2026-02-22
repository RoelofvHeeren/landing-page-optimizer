import fs from 'fs';
import path from 'path';

const htmlPath = 'temp_framer_home.html';
const imagesDir = 'public/images/home';

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const html = fs.readFileSync(htmlPath, 'utf-8');
const imageUrlRegex = /https:\/\/framerusercontent\.com\/images\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)/g;
const matches = [...new Set(html.match(imageUrlRegex) || [])];

console.log(`Found ${matches.length} unique images. Downloading...`);

const assetMap = {};

async function downloadImage(url) {
  const filename = path.basename(url);
  const dest = path.join(imagesDir, filename);
  
  if (fs.existsSync(dest)) {
    return dest;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(dest, buffer);
    return dest;
  } catch (error) {
    console.error(`Failed to download ${url}: ${error.message}`);
    return null;
  }
}

async function main() {
  for (const url of matches) {
    const dest = await downloadImage(url);
    if (dest) {
      assetMap[url] = `/images/home/${path.basename(dest)}`;
    }
  }
  
  fs.writeFileSync('home_asset_map.json', JSON.stringify(assetMap, null, 2));
  console.log('Download complete and map saved to home_asset_map.json');
}

main();
