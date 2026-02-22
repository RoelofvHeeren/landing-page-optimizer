import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetUrl = 'https://barn-gym.com/about';
const downloadFolder = path.join(__dirname, 'public', 'images', 'about');

if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder, { recursive: true });
}

const downloadedUrls = new Set();

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

    // Scroll to bottom to trigger lazy loading
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });

    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'live_about_full.png', fullPage: true });
    console.log('Saved baseline screenshot as live_about_full.png');

    // Extract framerusercontent.com images
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

    console.log(`Found ${imageUrls.length} unique Framer assets. Downloading...`);

    for (const url of imageUrls) {
        if (downloadedUrls.has(url)) continue;
        downloadedUrls.add(url);

        try {
            const urlObj = new URL(url);
            const filename = path.basename(urlObj.pathname);
            const filepath = path.join(downloadFolder, filename);

            await downloadImage(url, filepath);
            console.log(`Downloaded: ${filename}`);
        } catch (e) {
            console.error(`Failed to download ${url}:`, e.message);
        }
    }

    await browser.close();
    console.log('Finished scraping about page.');
})();
