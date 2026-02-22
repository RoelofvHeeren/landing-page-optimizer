import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetUrl = 'https://barn-gym.com/how-to-join/6-week-transformation';
const downloadFolder = path.join(__dirname, 'public', 'images', 'transformation');

if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder, { recursive: true });
}

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
    const page = await browser.newPage({
        viewport: { width: 1440, height: 1080 }
    });

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'live_transformation_full.png', fullPage: true });
    console.log('Saved baseline screenshot as live_transformation_full.png');

    const imageUrls = await page.evaluate(() => {
        const urls = [];
        document.querySelectorAll('img').forEach(img => {
            if (img.src && img.src.includes('framerusercontent.com')) {
                urls.push(img.src);
            }
        });
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

    await browser.close();
    console.log('Finished scraping transformation page.');
})();
