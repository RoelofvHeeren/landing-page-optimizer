import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pages = [
    { name: '404', url: 'https://barn-gym.com/404' },
    { name: 'privacy', url: 'https://barn-gym.com/legal/privacy-policy' },
    { name: 'cookie', url: 'https://barn-gym.com/legal/cookie-policy' },
    { name: 'terms', url: 'https://barn-gym.com/legal/terms-and-conditions' }
];

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
            }
        }).on('error', reject);
    });
};

(async () => {
    const browser = await chromium.launch();

    for (const p of pages) {
        const page = await browser.newPage({
            viewport: { width: 1440, height: 1080 }
        });

        console.log(`Scraping ${p.name}...`);
        try {
            await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(2000);
            await page.screenshot({ path: `live_${p.name}_full.png`, fullPage: true });

            const downloadFolder = path.join(__dirname, 'public', 'images', p.name);
            if (!fs.existsSync(downloadFolder)) {
                fs.mkdirSync(downloadFolder, { recursive: true });
            }

            const imageUrls = await page.evaluate(() => {
                const urls = [];
                document.querySelectorAll('img').forEach(img => {
                    if (img.src && img.src.includes('framerusercontent.com')) {
                        urls.push(img.src);
                    }
                });
                const elements = document.querySelectorAll('*');
                for (let el of elements) {
                    const style = window.getComputedStyle(el);
                    if (style.backgroundImage && style.backgroundImage !== 'none') {
                        const match = style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
                        if (match && match[1] && match[1].includes('framerusercontent.com')) {
                            urls.push(match[1]);
                        }
                    }
                }
                return [...new Set(urls)];
            });

            for (const url of imageUrls) {
                try {
                    const urlObj = new URL(url);
                    const filename = path.basename(urlObj.pathname).split('?')[0];
                    const filepath = path.join(downloadFolder, filename);
                    await downloadImage(url, filepath);
                } catch (e) { }
            }
        } catch (e) {
            console.error(`Failed to scrape ${p.name}:`, e.message);
        }
        await page.close();
    }

    await browser.close();
    console.log('Finished scraping utility pages.');
})();
