import fs from 'fs';
import { chromium } from 'playwright';

const images = fs.readdirSync('public/images/community_vsl').filter(f => !f.startsWith('.'));

const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; background: #fff; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 20px; }
        .card { border: 1px solid #ddd; padding: 10px; text-align: center; }
        img { max-width: 100%; height: auto; max-height: 150px; object-fit: contain; }
        p { font-size: 10px; margin-top: 5px; word-break: break-all; }
    </style>
</head>
<body>
    <h2>Downloaded Images Gallery (Community VSL)</h2>
    <div class="grid">
        ${images.map(img => `
            <div class="card">
                <img src="${process.cwd()}/public/images/community_vsl/${encodeURIComponent(img)}" />
                <p>${img}</p>
            </div>
        `).join('')}
    </div>
</body>
</html>
`;

fs.writeFileSync('gallery_community_vsl.html', html);

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    await page.goto(`file://${process.cwd()}/gallery_community_vsl.html`);
    await page.screenshot({ path: 'gallery_community_vsl_full.png', fullPage: true });
    await browser.close();
    console.log('Community VSL gallery screenshot created.');
})();
