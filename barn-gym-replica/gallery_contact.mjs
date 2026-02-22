import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const directoryPath = path.join(__dirname, 'public', 'images', 'contact');

const files = fs.readdirSync(directoryPath).filter(file => file.match(/\.(png|jpe?g|gif|svg|webp)$/i));

let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Downloaded Images Gallery (Contact)</title>
    <style>
        body { font-family: sans-serif; padding: 20px; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; }
        .item { border: 1px solid #ccc; padding: 10px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; }
        .item img { max-width: 100%; max-height: 150px; object-fit: contain; margin-bottom: 10px; }
        .item p { font-size: 10px; word-break: break-all; margin: 0; }
    </style>
</head>
<body>
    <h2>Downloaded Images Gallery (Contact)</h2>
    <div class="gallery">
        ${files.map(file => `
        <div class="item">
            <img src="file://${path.join(directoryPath, file)}" alt="${file}">
            <p>${file}</p>
        </div>
        `).join('')}
    </div>
</body>
</html>
`;

const galleryPath = path.join(__dirname, 'gallery_contact.html');
fs.writeFileSync(galleryPath, html);
console.log(`Gallery generated at ${galleryPath}`);

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.goto(`file://${galleryPath}`);
    await page.screenshot({ path: 'gallery_contact_full.png', fullPage: true });
    await browser.close();
    console.log('Gallery screenshot generated: gallery_contact_full.png');
})();
